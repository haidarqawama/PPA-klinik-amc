package controllers

const validExpireDateWhere = `
	AND expire IS NOT NULL
	AND expire <> ''
	AND expire <> '0000-00-00'
	AND expire >= '1990-01-01'
	AND YEAR(expire) >= 1990
	AND YEAR(expire) <= YEAR(CURDATE()) + 15
`
