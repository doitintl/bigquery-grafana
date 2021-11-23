package driver

type result struct {
	lastInsertID int64
	rowsAffected int64
}

// LastInsertId is just passing through a zero value
func (r *result) LastInsertId() (int64, error) {
	return r.lastInsertID, nil
}

//RowsAffected is just passing through a zero value
func (r *result) RowsAffected() (int64, error) {
	return r.rowsAffected, nil
}
