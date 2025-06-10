package types

type BrowseFilters struct {
	Artists    FilterGroup `json:"artists"`
	Groups     FilterGroup `json:"groups"`
	Tags       FilterGroup `json:"tags"`
	Characters FilterGroup `json:"characters"`
	Parodies   FilterGroup `json:"parodies"`
	Languages  []string    `json:"languages"`
	Rating     RangeFilter `json:"rating"`
	OCount     RangeFilter `json:"oCount"`
	Formats    []string    `json:"formats"`
	Genres     []string    `json:"genres"`
	Search     string      `json:"search"`
	PageCount  RangeFilter `json:"pageCount"`
}

type FilterGroup struct {
	Included []string `json:"included"`
	Excluded []string `json:"excluded"`
}

type RangeFilter struct {
	Min int `json:"min"`
	Max int `json:"max"`
}
