package driver

import "testing"

func Test_result_LastInsertId(t *testing.T) {
	type fields struct {
		rowsAffected int64
		lastInsertID int64
	}
	tests := []struct {
		name    string
		fields  fields
		want    int64
		wantErr bool
	}{
		{
			name: "OK",
			fields: fields{
				lastInsertID: 3,
			},
			want:    3,
			wantErr: false,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			r := &result{
				lastInsertID: tt.fields.lastInsertID,
				rowsAffected: tt.fields.rowsAffected,
			}
			got, err := r.LastInsertId()
			if (err != nil) != tt.wantErr {
				t.Errorf("LastInsertId() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if got != tt.want {
				t.Errorf("LastInsertId() got = %v, want %v", got, tt.want)
			}
		})
	}
}

func Test_result_RowsAffected(t *testing.T) {
	type fields struct {
		rowsAffected int64
		lastInsertID int64
	}
	tests := []struct {
		name    string
		fields  fields
		want    int64
		wantErr bool
	}{
		{
			name: "OK",
			fields: fields{
				rowsAffected: 7,
			},
			want:    7,
			wantErr: false,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			r := &result{
				lastInsertID: tt.fields.lastInsertID,
				rowsAffected: tt.fields.rowsAffected,
			}
			got, err := r.RowsAffected()
			if (err != nil) != tt.wantErr {
				t.Errorf("RowsAffected() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if got != tt.want {
				t.Errorf("RowsAffected() got = %v, want %v", got, tt.want)
			}
		})
	}
}
