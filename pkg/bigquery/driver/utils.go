package bigquery

import (
	"fmt"
	"net/url"
	"strings"
)

// ConfigFromConnString will return the Config structures
func ConfigFromConnString(in string) (*Config, error) {
	cfg := &Config{}
	if strings.HasPrefix(in, "bigquery://") {
		u, err := url.Parse(in)
		if err != nil {
			return nil, fmt.Errorf("invalid connection string: %s (%s)", in, err.Error())
		}
		v, err := url.ParseQuery(u.RawQuery)
		if err != nil {
			return nil, fmt.Errorf("invalid connection string: %s (%s)", in, err.Error())
		}
		fields := strings.Split(strings.TrimPrefix(u.Path, "/"), "/")
		if len(fields) != 2 {
			return nil, fmt.Errorf("invalid connection string: %s", in)
		}
		cfg.ProjectID = u.Host
		cfg.Location = fields[0]
		cfg.DatasetID = fields[1]
		cfg.ApiKey = v.Get("apiKey")
		cfg.Credentials = v.Get("credentials")
		fmt.Errorf("CREDENTIALS", cfg.Credentials)
		return cfg, nil
	} else {
		// Nope, bad prefix
		return nil, fmt.Errorf("invalid prefix, expected bigquery:// got: %s", in)
	}

}
