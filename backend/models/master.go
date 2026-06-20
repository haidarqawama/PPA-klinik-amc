package models

// MasterPayload represents the request payload for master data operations
type MasterPayload struct {
	Code string `json:"code"`
	Name string `json:"name"`
}

// MasterTableConfig represents the configuration for a master data table
type MasterTableConfig struct {
	Table      string
	CodeCol    string
	NameCol    string
	EntityName string
}
