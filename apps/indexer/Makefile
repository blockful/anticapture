SCRIPTS_DIR := ./scripts/
DUMPS_DIR   := ./scripts/dumps

.PHONY: dump restore migrate backup download list delete help

help: ## Show available commands
	@grep -E '^[a-z_-]+:.*##' $(MAKEFILE_LIST) | awk -F ':.*## ' '{printf "  make %-12s %s\n", $$1, $$2}'

# --- Local (no S3) ---

dump: ## Dump ponder_sync from a database. Usage: make dump DB=<database_url> [OUT=<file>]
	$(SCRIPTS_DIR)dump.sh $(DB) $(OUT)

restore: ## Restore a dump to a database. Usage: make restore FILE=<dump> DB=<database_url> [FORCE=1]
	$(SCRIPTS_DIR)restore.sh $(FILE) $(DB)

# --- S3 ---

backup: ## Upload a dump to S3. Usage: make backup FILE=<dump>
	$(SCRIPTS_DIR)backup_dump.sh $(FILE)

download: ## Download a dump from S3. Usage: make download FILE=<filename>
	$(SCRIPTS_DIR)download_dump.sh $(FILE)

list: ## List dumps in S3
	$(SCRIPTS_DIR)list_dumps.sh

delete: ## Delete a dump from S3. Usage: make delete FILE=<filename>
	$(SCRIPTS_DIR)delete_dump.sh $(FILE)

# --- Migration ---

migrate: ## Dump from SRC and restore to DST. Usage: make migrate SRC=<db_url> DST=<db_url> [FORCE=1]
	@test -n "$(SRC)" || (echo "Usage: make migrate SRC=<source_db_url> DST=<target_db_url>" && exit 1)
	@test -n "$(DST)" || (echo "Usage: make migrate SRC=<source_db_url> DST=<target_db_url>" && exit 1)
	$(SCRIPTS_DIR)dump.sh $(SRC)
	$(eval LATEST := $(shell ls -t $(DUMPS_DIR)/*.dump 2>/dev/null | head -1))
	@test -n "$(LATEST)" || (echo "ERROR: No dump file found" && exit 1)
	$(SCRIPTS_DIR)restore.sh $(LATEST) $(DST)
	@echo ""
	@echo "=== Migration complete ==="
