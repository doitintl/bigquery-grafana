package driver

import "github.com/grafana/grafana-plugin-sdk-go/backend/log"

type tx struct {
	c *Conn
}

func newTx(c *Conn) (*tx, error) {
	return &tx{c: c}, nil
}

// Commit currently just  passes through
func (t *tx) Commit() (err error) {
	log.DefaultLogger.Debug("Got tx.Commit")

	return
}

// Rollback currently just  passes through
func (t *tx) Rollback() (err error) {
	log.DefaultLogger.Debug("Got tx.Rollback")
	return
}
