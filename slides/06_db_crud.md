# CRUD functions

## create(token, col, doc) => inserted doc
## getById(token, col, id) => document
## list(token, col, listParams) => list of docs
## query(token, col, filters, listParams) => list of docs
## update(token, col, id, update_doc) => updated_doc
## delete(token, col, id) => boolean

# Query filters

## [["field", "==", "value"], ...]

# List params

## { page: 1, aize: 50, desc: true }
