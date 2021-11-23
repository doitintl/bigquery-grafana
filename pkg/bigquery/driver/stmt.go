package driver

import (
	"context"
	"database/sql/driver"

	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
)

type stmt struct {
	query string
	c     *Conn
}

func NewStmt(query string, c *Conn) *stmt {
	return &stmt{query: query, c: c}
}

func (s *stmt) Close() error {
	return nil
}

func (s *stmt) NumInput() int {
	return -1
}

// Deprecated: Drivers should implement StmtExecContext instead (or additionally).
func (s *stmt) Exec(args []driver.Value) (driver.Result, error) {
	log.DefaultLogger.Debug("Got stmt.Exec", s.query)
	return s.c.Exec(s.query, args)
}

func (s *stmt) ExecContext(ctx context.Context, args []driver.NamedValue) (driver.Result, error) {
	return s.c.ExecContext(ctx, s.query, args)
}

// Deprecated: Drivers should implement StmtQueryContext instead (or additionally).
func (s *stmt) Query(args []driver.Value) (driver.Rows, error) {
	log.DefaultLogger.Debug("Got stmt.Query", s.query)
	return s.c.Query(s.query, args)
}

func (s *stmt) QueryContext(ctx context.Context, args []driver.NamedValue) (driver.Rows, error) {
	return s.c.QueryContext(ctx, s.query, args)
}
