package main

import (
	"bytes"
	"context"
	"crypto/sha256"
	"crypto/md5"
	"fmt"
	"errors"
	"encoding/hex"
	"encoding/json"
	"io/ioutil"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strconv"
	"strings"
	"github.com/go-redis/redis/v8"
	"sync"
	"os"
	"io"
	"time"
)

var client *redis.Client
var _ http.RoundTripper = &transport{}
var cache = &sync.Map{}
var ttl int

type cacheValue struct {
	httpBody   []byte
	httpHeader http.Header
	cacheTime  time.Time
}

func main() {

	// Reverse proxy
	remote, err := url.Parse("https://bigquery.googleapis.com")
	if err != nil {
		log.Fatal(err)
	}

	// type ErrorObject[]interface{}

	handler := func(p *httputil.ReverseProxy) func(http.ResponseWriter, *http.Request) {
		return func(w http.ResponseWriter, r *http.Request) {
			log.Println(r.URL)
			if (strings.Contains(r.URL.String(), "/redis/validate/")) {
				redisResp, redisErr := validateRedisConnection(r.URL.String())
				if redisErr != nil {
					w.WriteHeader(http.StatusBadRequest)
					w.Header().Set("Content-Type", "application/json")
					type ErrorObject map[string]interface{}
					resp := ErrorObject{"error": ErrorObject{"message": redisErr.Error(), "code": 400, "errors":[]ErrorObject{{"reason": redisErr.Error()}}}}
					jsonResp, err := json.Marshal(resp)
					if err != nil {
						log.Fatalf("Error happened in JSON marshal. Err: %s", err)
					}
					w.Write(jsonResp)
				} else {
					w.Header().Set("Content-Type", "application/json")
					resp := make(map[string]string)
					resp["message"] = redisResp
					jsonResp, err := json.Marshal(resp)
					if err != nil {
						log.Fatalf("Error happened in JSON marshal. Err: %s", err)
					}
					w.Write(jsonResp)
				}
			} else {
				r.Host = remote.Host
				p.ServeHTTP(w, r)
			}
		}
	}
	proxy := httputil.NewSingleHostReverseProxy(remote)
	proxy.Transport = &transport{http.DefaultTransport}
	http.HandleFunc("/", handler(proxy))
	err = http.ListenAndServe("127.0.0.1:8880", nil)
	if err != nil {
		log.Fatal(err)
	}
}

type transport struct {
	http.RoundTripper
}

func validateRedisConnection(url string) (resp string, err error) {
	splitURL := strings.Split(url, "/redis/validate/")[1]
	redisParams := strings.Split(splitURL, "/")
	redisDb,_convErr := strconv.Atoi(redisParams[1])
	if _convErr != nil {
		return "", errors.New("Invalid Database")
	}
	redisPassword := ""
	if len(redisParams) > 2 {
		redisPassword = redisParams[2]
	}
	redisClient := redis.NewClient(&redis.Options{
		Addr:   	redisParams[0] ,
		Password: 	redisPassword,
		DB:       	redisDb ,
	})

	ctx := context.Background()
	redisResp, redisErr := redisClient.Ping(ctx).Result()
	if redisErr != nil {
		return "", redisErr
	}
	return redisResp, nil
}

func (t *transport) RoundTrip(req *http.Request) (resp *http.Response, err error) {
	var key string
	request,error:=requestJson(req) 
	log.Printf("duration: %v \n", request.CacheDuration)

	// check if cache is enabled
	if error!=nil{
		log.Printf("%v", request.CacheEnabled)
	}
	q:=request.Query
	if !request.CacheEnabled {
		resp, err = t.RoundTripper.RoundTrip(req)
		if err != nil {
			return nil, err
		}
		return resp, nil
	} else {
		if q != "" {
			x := sha256.Sum256([]byte(q))
			key = hex.EncodeToString(x[:])
			log.Printf("key: %x \n", key)
		}
		if key != "" {
			// if cache type is 'Redis'
			if request.CacheType=="redis"{
				ctx := context.Background()
				// Redis url from input data
				redisURL := request.CacheData.CacheURL
				log.Printf("redisURL : %v\n", redisURL)
				
				if strings.Contains(redisURL, "://") {
					addr :=strings.Split(redisURL, "/")
					redisURL = addr[2]
				}
				// create a redis client and connect to server
				client = redis.NewClient(&redis.Options{
					Addr:   	redisURL ,
					Password: 	request.CacheData.CachePassword,
					DB:       	int(request.CacheData.CacheDatabase),
				})

				_, err := client.Ping(ctx).Result()
				if err != nil {
					log.Fatalf("unable to connect to redis %v, %v\n", redisURL, err)
					return nil, err
				}
				log.Println("successfully connected to redis")
				// if query data is present in cache, return from cache
				if b, err := client.Get(req.Context(), key).Result(); err == nil && b != "" {
					resp := &http.Response{
						Header: make(map[string][]string),
					}
					resp.Body = ioutil.NopCloser(bytes.NewReader([]byte(b)))
					resp.ContentLength = int64(len(b))
					//resp.Header.Set("Content-Length", strconv.Itoa(len(b)))
					resp.Header.Set("Content-Encoding", "gzip")
					resp.StatusCode = http.StatusOK;
					log.Println("returning resp from cache!!")
					return resp, nil
				} else {
					// if query data is not preset in cache, connect to bigquery, save data to redis cache and return results to grafana 
					resp, err = t.RoundTripper.RoundTrip(req)
					if err != nil {
						return nil, err
					}

					if resp.StatusCode == http.StatusOK {
						b, err := ioutil.ReadAll(resp.Body)
						if err != nil {
								return nil, fmt.Errorf("error reading remote response body: %v", err)
						}
						if err := resp.Body.Close(); err != nil {
								return nil, fmt.Errorf("error closing remote response body: %v", err)
						}
						fmt.Println("storing cache entry")
						b = bytes.Replace(b, []byte("server"), []byte("schmerver"), -1)
						resp.Body = ioutil.NopCloser(bytes.NewReader(b))
						resp.ContentLength = int64(len(b))
						resp.Header.Set("Content-Length", strconv.Itoa(len(b)))
						if key != "" {
							if int(request.CacheDuration) > 0 {				// <--
								fmt.Printf("using cache duration: %v \n", request.CacheDuration)
								client.Set(req.Context(), key, string(b), time.Duration(int(request.CacheDuration)) * time.Minute) 
							} else {
								log.Printf("Invalid Cache Duration in the input !")
								// client.Set(req.Context(), key, string(b), time.Duration(24) * time.Hour)  
								// client.Set(req.Context(), key, string(b), 0) <--
							}
							
						}
						log.Println("returning resp from bigquery!!")
						return resp, nil
					}
				}

			} else if request.CacheType=="local"{

				if req.Method != http.MethodPost {
					// No query object to worry about caching with, just proxy as-is.
					fmt.Println("Not a post method, proceed as-is")
					return t.RoundTripper.RoundTrip(req)
				}
				var body map[string]interface{}
				reqBytes, err := ioutil.ReadAll(req.Body)
				if err != nil {
						return nil, fmt.Errorf("error reading request body")
				}
				if err := json.Unmarshal(reqBytes, &body); err != nil {
						panic(err)
				}
				query, ok := body["query"].(string)
				if !ok {
						// No query object to worry about caching with, just proxy as-is.
						fmt.Println("no body object, proceed as-is")
						return t.RoundTripper.RoundTrip(req)
				}
				hash := md5.Sum([]byte(query))
				cacheKey := hex.EncodeToString(hash[:])
				v, found := cache.Load(cacheKey)
				fmt.Fprintf(os.Stdout, "key: %v, cache-hit: %v \n", cacheKey, found)
				if found {
						cachedValue := v.(*cacheValue)
						if int(request.CacheDuration) > 0 {					// <---- new
							ttl = int(request.CacheDuration) * 60
						} else {
							log.Printf("Invalid Cache Duration in the input !")
							// ttl = 86400
						}
						fmt.Println("ttl: ", ttl)
						if int(time.Now().Sub(cachedValue.cacheTime).Seconds()) < ttl{ 	// <--------change
							fmt.Println("returning response from cache")
							b := bytes.NewBuffer(cachedValue.httpBody)
							resp = &http.Response{
									Header: cachedValue.httpHeader,
							}
							resp.Body = io.NopCloser(b)
							resp.ContentLength = int64(b.Len())
							resp.StatusCode = http.StatusOK
							return resp, nil

						} else {
							cache.Delete(cacheKey)
						}
						
				}
				// No object found in cache. Send request to server and cahce results.

				// Put the request bytes back on the buffer.
				req.Body = io.NopCloser(bytes.NewBuffer(reqBytes))
				// Send the request to the remote server.
				resp, err = t.RoundTripper.RoundTrip(req)
				if err != nil {
						return nil, err
				}
				if resp.StatusCode == http.StatusOK {
						b, err := ioutil.ReadAll(resp.Body)
						if err != nil {
								return nil, fmt.Errorf("error reading remote response body: %v", err)
						}
						if err := resp.Body.Close(); err != nil {
								return nil, fmt.Errorf("error closing remote response body: %v", err)
						}
						fmt.Println("storing cache entry")
						v := &cacheValue{httpBody: b, httpHeader: resp.Header, cacheTime: time.Now()}
						cache.Store(cacheKey, v)
						// Put the backs back onto the response body's buffer.
						resp.Body = io.NopCloser(bytes.NewBuffer(b))
				}
			}
			
		}
	}
	return resp, err
}

func query(r *http.Request) string {
	type query struct {
		Query string `json:"query"`
	}

	var b bytes.Buffer
	if _, err := b.ReadFrom(r.Body); err != nil {
		return ""
	}
	r.Body = ioutil.NopCloser(&b)
	body := ioutil.NopCloser(bytes.NewReader(b.Bytes()))
	decoder := json.NewDecoder(body)
	var q query
	err1 := decoder.Decode(&q)
	if err1 != nil {
		log.Printf("error decoding query, %v\n", err1)
		return ""
	}
	log.Printf("query : %v\n", q.Query)
	return q.Query
}

type redisConfig struct {
	CacheURL string `json:"url"`
	CacheDatabase int `json:"database"`
	// CacheUsername string `json:"username"`
	CachePassword string `json:"password"`
}

type requestBody struct {
	Query string `json:"query"`
	CacheEnabled bool `json:"cacheEnabled"`
	Location string `json:"location"`
	Priority string `json:"priority"`
	UseLegacySql bool `json:"useLegacySql"`
	UseQueryCache bool `json:"useQueryCache"`
	CacheType string `json:"cacheType"`
	CacheDuration int `json:"cacheDuration"`
	CacheData redisConfig `json:"cacheData"`
}

func requestJson(r *http.Request) (requestBody,error) {
	var q requestBody
	var b bytes.Buffer
	if r.Body != nil{
		if _, err := b.ReadFrom(r.Body); err != nil {
			return q, err
		}
		r.Body = ioutil.NopCloser(&b)
		body := ioutil.NopCloser(bytes.NewReader(b.Bytes()))
		decoder := json.NewDecoder(body)
		
		err1 := decoder.Decode(&q)
		if err1 != nil {
			log.Printf("error decoding query, %v\n", err1)
			return q, err1
		}
		log.Printf("query : %v\n", q.Query)
		log.Printf("cacheEnabled : %v\n", q.CacheEnabled)
		log.Printf("cacheType : %v\n", q.CacheType)
		return q, nil
	} else {
		return q, nil
	}
	
}