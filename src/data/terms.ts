// Glossary. Format per line: term ¦ category ¦ day slug ¦ plain English ¦ literal definition ¦ example
export type Term = { id: string; term: string; cat: string; day: string; week: number; plain: string; literal: string; example: string };
const RAW = `
Variable ¦ python ¦ w1d1 ¦ A name that points to a value. ¦ A binding in a namespace from an identifier to an object reference. ¦ total = 7.5
List ¦ python ¦ w1d1 ¦ An ordered collection you can change. ¦ Mutable sequence type supporting indexing, slicing and append. ¦ hours = [7.5, 8, 6]
Dictionary ¦ python ¦ w1d1 ¦ A key → value lookup. ¦ Mutable hash map from hashable keys to values. ¦ w = {"name": "Aisha", "hours": 8}
Tuple ¦ python ¦ w1d1 ¦ A fixed sequence you cannot change. ¦ Immutable sequence; hashable when all items are hashable. ¦ point = (3, 4)
f-string ¦ python ¦ w1d1 ¦ Text with variables dropped straight in. ¦ String literal prefixed with f whose {expressions} are evaluated at runtime. ¦ f"{name}: {total}h"
Function ¦ python ¦ w1d1 ¦ A reusable named block of code. ¦ Callable defined with def that takes parameters and returns a value (None by default). ¦ def total(h): return sum(h)
Virtual environment ¦ python ¦ w1d1 ¦ A private package folder for one project. ¦ Isolated interpreter prefix with its own site-packages directory. ¦ uv venv && source .venv/bin/activate
uv ¦ python ¦ w1d1 ¦ A very fast Python project and package manager. ¦ Rust-based tool that creates environments, resolves and locks dependencies, and runs scripts. ¦ uv add "psycopg[binary]"
pip ¦ python ¦ w1d1 ¦ Python's classic package installer. ¦ Installs distributions from PyPI into the active environment. ¦ pip install requests
List comprehension ¦ python ¦ w1d2 ¦ A one-line loop that builds a list. ¦ Expression [expr for x in iterable if cond] producing a new list. ¦ [s for s in shifts if s > 6]
Class ¦ python ¦ w1d2 ¦ A blueprint for making objects. ¦ User-defined type bundling attributes and methods; instances are created by calling it. ¦ class Shift: ...
dataclass ¦ python ¦ w1d2 ¦ A class that writes its own boilerplate. ¦ Decorator generating __init__, __repr__ and __eq__ from annotated fields. ¦ @dataclass class Shift: hours: float
Exception ¦ python ¦ w1d2 ¦ An error you can catch and handle. ¦ Object raised to unwind the call stack until handled by try/except. ¦ try: int("x") except ValueError: pass
Type hints ¦ python ¦ w1d2 ¦ Labels saying what type a value should be. ¦ Annotations read by tools such as mypy; not enforced at runtime. ¦ def pay(hours: float) -> float:
Lambda ¦ python ¦ w1d2 ¦ A tiny unnamed function. ¦ Anonymous function limited to a single expression. ¦ sorted(ws, key=lambda w: w["hours"])
psycopg ¦ python ¦ w1d2 ¦ The Python driver for talking to Postgres. ¦ PostgreSQL adapter (v3) implementing DB-API with server-side parameter binding. ¦ psycopg.connect("postgresql://postgres:dev@localhost/postgres")
Module ¦ python ¦ w1d3 ¦ A .py file you can import. ¦ Namespace loaded from a source file by the import system. ¦ import json
JSON ¦ python ¦ w1d3 ¦ A text format for structured data. ¦ JavaScript Object Notation: objects, arrays, strings, numbers, booleans and null. ¦ json.loads('{"a": 1}')
Context manager ¦ python ¦ w1d3 ¦ A "with" block that cleans up after itself. ¦ Object implementing __enter__/__exit__ for guaranteed setup and teardown. ¦ with open("f.txt") as f:
Generator ¦ python ¦ w1d3 ¦ A function that hands out values one at a time. ¦ Function containing yield; calling it returns a lazy iterator. ¦ def rows(): yield 1
pandas ¦ python ¦ w1d7 ¦ Spreadsheet-style tables in Python. ¦ Library providing the DataFrame: labelled 2-D columns with vectorised operations. ¦ df.groupby("worker").hours.sum()
async/await ¦ python ¦ w2d5 ¦ Wait on many things at once without threads. ¦ Coroutines scheduled on an event loop; await suspends until the awaitable completes. ¦ await conn.execute(q)
asyncio ¦ python ¦ w2d5 ¦ Python's built-in library for async code. ¦ Standard-library framework for running coroutines concurrently on an event loop. ¦ asyncio.run(main())
pytest ¦ python ¦ w3d7 ¦ The standard Python test runner. ¦ Framework that discovers test_*.py functions and checks plain assert statements. ¦ def test_rls(): assert rows == []
FastAPI ¦ python ¦ w4d1 ¦ A Python framework for building web APIs. ¦ ASGI framework using type hints for validation and automatic OpenAPI docs. ¦ @app.get("/ask")
Pydantic ¦ python ¦ w4d1 ¦ Checks incoming data matches the types you declared. ¦ Library building validated models from annotated classes. ¦ class Q(BaseModel): text: str
SELECT ¦ sql ¦ w1d2 ¦ Read rows from tables. ¦ Statement returning a result set from a query expression. ¦ SELECT name FROM workers;
JOIN ¦ sql ¦ w1d2 ¦ Combine rows from two tables that match. ¦ Produces pairs of rows that satisfy a join condition. ¦ JOIN shifts s ON s.worker_id = w.id
LEFT JOIN ¦ sql ¦ w1d2 ¦ Keep every left row, even with no match. ¦ Outer join filling unmatched right-side columns with NULL. ¦ workers w LEFT JOIN shifts s ON ...
Primary key ¦ sql ¦ w1d2 ¦ The unique ID column of a table. ¦ Constraint equal to UNIQUE + NOT NULL, backed by a unique B-tree index. ¦ id serial PRIMARY KEY
Foreign key ¦ sql ¦ w1d2 ¦ A column that must point to a real row elsewhere. ¦ Constraint requiring values to exist in the referenced table's key. ¦ worker_id int REFERENCES workers
NULL ¦ sql ¦ w1d2 ¦ "No value / unknown". ¦ Marker for missing data; comparisons with NULL yield NULL, not true or false. ¦ WHERE ended_at IS NULL
Transaction ¦ sql ¦ w1d2 ¦ An all-or-nothing group of changes. ¦ Unit of work bounded by BEGIN and COMMIT or ROLLBACK. ¦ BEGIN; UPDATE ...; COMMIT;
ACID ¦ sql ¦ w1d2 ¦ The four promises of a safe database. ¦ Atomicity, Consistency, Isolation, Durability. ¦ A crash mid-transfer leaves nothing half-applied.
Constraint ¦ sql ¦ w1d2 ¦ A rule the data must obey. ¦ Declarative condition enforced on write: CHECK, UNIQUE, NOT NULL, FOREIGN KEY, PRIMARY KEY. ¦ CHECK (hours > 0)
Parameterized query ¦ sql ¦ w1d2 ¦ Send values separately from the SQL text. ¦ Placeholders bound by the driver/server so input is never parsed as SQL. ¦ cur.execute("SELECT * FROM w WHERE id = %s", (wid,))
Normalization ¦ sql ¦ w1d2 ¦ Store each fact exactly once. ¦ Schema design that splits data into tables to remove redundancy (1NF–3NF). ¦ A workers table instead of repeating names on every shift
UPSERT ¦ sql ¦ w1d3 ¦ Insert, or update if it already exists. ¦ INSERT ... ON CONFLICT (key) DO UPDATE. ¦ ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
jsonb ¦ sql ¦ w1d3 ¦ JSON stored in a fast, indexable binary form. ¦ Postgres type storing decomposed JSON; supports GIN indexes and containment operators. ¦ data->>'name'
GROUP BY ¦ sql ¦ w1d4 ¦ Put rows into buckets to summarise them. ¦ Collapses rows sharing values into one row per group for aggregates. ¦ GROUP BY worker_id
HAVING ¦ sql ¦ w1d4 ¦ WHERE, but for groups. ¦ Filter applied after aggregation. ¦ HAVING sum(hours) > 38
Aggregate function ¦ sql ¦ w1d4 ¦ Turns many rows into one number. ¦ Function computing a single result over a set of rows: count, sum, avg, min, max. ¦ SELECT count(*) FROM shifts;
Subquery ¦ sql ¦ w1d4 ¦ A query inside another query. ¦ Nested SELECT used as a value, a row set, or an EXISTS test. ¦ WHERE id IN (SELECT worker_id FROM shifts)
CTE ¦ sql ¦ w1d4 ¦ A named temporary query using WITH. ¦ Common Table Expression: auxiliary statement scoped to a single query. ¦ WITH t AS (SELECT ...) SELECT * FROM t
Window function ¦ sql ¦ w1d4 ¦ Calculate across related rows without merging them. ¦ Function evaluated over a partition/ordering frame defined by OVER(). ¦ rank() OVER (ORDER BY hours DESC)
View ¦ sql ¦ w1d4 ¦ A saved query you use like a table. ¦ Named query expanded into the calling query at execution time. ¦ CREATE VIEW weekly AS SELECT ...
Materialized view ¦ sql ¦ w1d6 ¦ A view saved to disk for speed. ¦ Query result stored physically and refreshed explicitly. ¦ REFRESH MATERIALIZED VIEW weekly;
Index ¦ postgres ¦ w1d5 ¦ A lookup structure to find rows fast. ¦ Secondary structure mapping key values to heap tuple locations. ¦ CREATE INDEX ON shifts(worker_id);
B-tree ¦ postgres ¦ w1d5 ¦ The default index; great for = and ranges. ¦ Balanced tree index supporting equality, range predicates and ORDER BY. ¦ CREATE INDEX ... USING btree (starts_at)
Composite index ¦ postgres ¦ w1d5 ¦ One index over several columns. ¦ Multicolumn index usable when the query constrains a leading prefix of its columns. ¦ ON shifts(worker_id, starts_at)
Partial index ¦ postgres ¦ w1d5 ¦ An index that only covers some rows. ¦ Index built with a WHERE predicate; used when the query implies the predicate. ¦ ON shifts(id) WHERE status = 'open'
EXPLAIN ¦ postgres ¦ w1d5 ¦ Shows how Postgres plans to run a query. ¦ Prints the planner's chosen plan tree with estimated costs and rows. ¦ EXPLAIN SELECT * FROM shifts WHERE id = 1;
EXPLAIN ANALYZE ¦ postgres ¦ w1d5 ¦ Runs the query and shows real timings. ¦ Executes the statement and reports actual rows, loops and time per plan node. ¦ EXPLAIN (ANALYZE, BUFFERS) SELECT ...
Seq Scan ¦ postgres ¦ w1d5 ¦ Reading the whole table, row by row. ¦ Plan node that reads every heap page of a table sequentially. ¦ Seq Scan on shifts (cost=0.00..18334.00)
Index Scan ¦ postgres ¦ w1d5 ¦ Use the index, then fetch the matching rows. ¦ Plan node traversing an index and fetching each matching heap tuple. ¦ Index Scan using shifts_pkey on shifts
Index Only Scan ¦ postgres ¦ w1d5 ¦ Answer straight from the index without touching the table. ¦ Plan node returning columns from the index, visiting the heap only when the visibility map requires. ¦ Index Only Scan using shifts_worker_idx
Bitmap Heap Scan ¦ postgres ¦ w1d5 ¦ Collect matches first, then read the pages in order. ¦ A Bitmap Index Scan builds a page bitmap; the heap scan then reads those pages sequentially. ¦ Bitmap Heap Scan on shifts  Recheck Cond: ...
Nested Loop ¦ postgres ¦ w1d5 ¦ For each row on one side, look up the other side. ¦ Join node iterating the outer input and probing the inner input per row. ¦ Nested Loop  -> Index Scan on workers
Hash Join ¦ postgres ¦ w1d5 ¦ Build a lookup table from one side, probe with the other. ¦ Join node hashing the inner relation, then probing it with each outer row. ¦ Hash Join  Hash Cond: (s.worker_id = w.id)
Merge Join ¦ postgres ¦ w1d5 ¦ Zip two sorted lists together. ¦ Join node merging two inputs already sorted on the join key. ¦ Merge Join  Merge Cond: (a.id = b.id)
Query planner ¦ postgres ¦ w1d5 ¦ The part of Postgres that picks the fastest plan. ¦ Cost-based optimizer using table statistics to choose plan nodes. ¦ ANALYZE shifts; refreshes its statistics
Planner cost ¦ postgres ¦ w1d5 ¦ The planner's estimate of work, not milliseconds. ¦ Arbitrary units (startup..total) derived from seq_page_cost, cpu_tuple_cost and friends. ¦ cost=0.42..8.44 rows=1
GIN index ¦ postgres ¦ w1d6 ¦ Index for values that contain many items (words, JSON keys, arrays). ¦ Generalized Inverted Index mapping each element to the rows containing it. ¦ CREATE INDEX ON events USING gin (data);
BRIN index ¦ postgres ¦ w1d6 ¦ A tiny index for huge, naturally ordered tables. ¦ Block Range Index storing min/max summaries per range of pages. ¦ CREATE INDEX ON readings USING brin (created_at);
pg_stat_statements ¦ postgres ¦ w1d6 ¦ A leaderboard of your slowest queries. ¦ Extension tracking execution statistics per normalised query. ¦ ORDER BY total_exec_time DESC LIMIT 5
Extension ¦ postgres ¦ w1d6 ¦ A plugin that adds features to Postgres. ¦ Packaged SQL objects and/or C code installed with CREATE EXTENSION. ¦ CREATE EXTENSION vector;
MVCC ¦ postgres ¦ w2d1 ¦ Readers and writers don't block each other. ¦ Multi-Version Concurrency Control: updates write new row versions; each transaction sees a snapshot. ¦ An UPDATE writes a new tuple and marks the old one dead
Heap tuple ¦ postgres ¦ w2d1 ¦ One physical version of a row. ¦ Row version in a heap page carrying xmin/xmax transaction headers. ¦ SELECT ctid, xmin, xmax FROM shifts;
Dead tuple ¦ postgres ¦ w2d1 ¦ An old row version nobody can see any more. ¦ Tuple whose deleting transaction committed and that is invisible to every snapshot. ¦ n_dead_tup in pg_stat_user_tables
VACUUM ¦ postgres ¦ w2d1 ¦ Cleans up dead rows so space is reused. ¦ Reclaims dead-tuple space, updates the visibility map and freezes old XIDs. ¦ VACUUM (VERBOSE) shifts;
Autovacuum ¦ postgres ¦ w2d1 ¦ The background cleaner that runs VACUUM for you. ¦ Daemon launching VACUUM/ANALYZE when per-table thresholds are crossed. ¦ autovacuum_vacuum_scale_factor = 0.05
XID wraparound ¦ postgres ¦ w2d1 ¦ The transaction counter runs out unless VACUUM freezes old rows. ¦ Transaction IDs are 32-bit; freezing prevents old rows becoming invisible. ¦ SELECT age(datfrozenxid) FROM pg_database;
Bloat ¦ postgres ¦ w2d1 ¦ Wasted space inside tables and indexes. ¦ Pages occupied by dead or free space that is not returned to the OS. ¦ Fix with VACUUM FULL or pg_repack
WAL ¦ postgres ¦ w2d1 ¦ A diary Postgres writes before changing data. ¦ Write-Ahead Log: changes are durably logged before data pages are flushed. ¦ the pg_wal/ directory
LSN ¦ postgres ¦ w2d1 ¦ A position in the WAL. ¦ Log Sequence Number: a byte offset into the WAL stream. ¦ SELECT pg_current_wal_lsn();
Checkpoint ¦ postgres ¦ w2d1 ¦ The moment changed pages are flushed to disk. ¦ Point after which crash recovery starts WAL replay; earlier changes are on disk. ¦ CHECKPOINT;
fsync ¦ postgres ¦ w2d1 ¦ Forces data onto the physical disk. ¦ System call flushing OS buffers to durable storage. ¦ synchronous_commit = on
Streaming replication ¦ postgres ¦ w2d1 ¦ A live copy of the database fed by the WAL. ¦ Standby receives WAL over a replication connection and replays it continuously. ¦ primary_conninfo = 'host=primary user=repl'
Primary ¦ postgres ¦ w2d1 ¦ The database server that accepts writes. ¦ The read-write server producing WAL. ¦ SELECT pg_is_in_recovery(); -- false
Replica ¦ postgres ¦ w2d1 ¦ A read-only copy of the database. ¦ Hot standby replaying the primary's WAL and serving read-only queries. ¦ SELECT pg_is_in_recovery(); -- true
Replication slot ¦ postgres ¦ w2d1 ¦ A bookmark that keeps WAL until the replica has read it. ¦ Server object retaining the WAL a consumer still needs. ¦ SELECT pg_create_physical_replication_slot('r1');
Replication lag ¦ postgres ¦ w2d2 ¦ How far behind the copy is. ¦ Delay between WAL generated on the primary and replayed on the standby. ¦ replay_lag in pg_stat_replication
Synchronous replication ¦ postgres ¦ w2d2 ¦ Wait for the copy before saying "saved". ¦ Commit waits until a standby confirms it received/applied the WAL. ¦ synchronous_standby_names = 'r1'
Read/write splitting ¦ postgres ¦ w2d2 ¦ Send reads to replicas and writes to the primary. ¦ Routing pattern directing read-only statements to standbys. ¦ router picks DSN by statement type
Failover ¦ postgres ¦ w2d2 ¦ Promote a replica when the primary dies. ¦ Process making a standby the new primary. ¦ SELECT pg_promote();
Connection pooling ¦ postgres ¦ w2d3 ¦ Many clients share a few database connections. ¦ A proxy reuses server connections across client sessions. ¦ PgBouncer on port 6432
PgBouncer ¦ postgres ¦ w2d3 ¦ A lightweight Postgres connection pooler. ¦ Single-process pooler with session, transaction and statement modes. ¦ pool_mode = transaction
Transaction pooling ¦ postgres ¦ w2d3 ¦ You hold a connection only during a transaction. ¦ Server connection returns to the pool at COMMIT/ROLLBACK. ¦ Session-level SET does not survive between transactions
Supavisor ¦ postgres ¦ w2d3 ¦ Supabase's cloud-scale pooler. ¦ Multi-tenant Elixir pooler in front of Supabase Postgres. ¦ port 6543 = transaction mode
max_connections ¦ postgres ¦ w2d3 ¦ The most clients Postgres will accept. ¦ Server setting; each connection is a backend process with its own memory. ¦ SHOW max_connections;
Partitioning ¦ postgres ¦ w2d4 ¦ Split one big table into smaller ones behind the scenes. ¦ Declarative division of a parent table into child partitions by RANGE, LIST or HASH. ¦ PARTITION BY RANGE (starts_at)
Partition pruning ¦ postgres ¦ w2d4 ¦ Skip partitions that cannot match. ¦ Planner/executor excludes partitions using predicates on the partition key. ¦ WHERE starts_at >= '2026-11-01'
Range partition ¦ postgres ¦ w2d4 ¦ A partition holding a range such as one month. ¦ Partition bound FOR VALUES FROM (a) TO (b), upper bound exclusive. ¦ FOR VALUES FROM ('2026-11-01') TO ('2026-12-01')
Sharding ¦ postgres ¦ w2d4 ¦ Spread data across several servers. ¦ Horizontal partitioning across separate database nodes. ¦ Citus distributes a table by tenant_id
pgbench ¦ postgres ¦ w2d5 ¦ Postgres's built-in load-testing tool. ¦ Benchmark running scripted transactions with N clients and reporting TPS and latency. ¦ pgbench -c 50 -j 4 -T 60 tlc
TPS ¦ postgres ¦ w2d5 ¦ Transactions per second. ¦ Throughput: committed transactions per second. ¦ tps = 1240.5
p95 latency ¦ postgres ¦ w2d5 ¦ 95% of requests are faster than this. ¦ 95th percentile of the response-time distribution. ¦ p95 = 40 ms
Lock ¦ postgres ¦ w2d5 ¦ Stops two changes clashing at the same time. ¦ Mechanism serialising access to rows or tables. ¦ SELECT ... FOR UPDATE
Deadlock ¦ postgres ¦ w2d5 ¦ Two transactions waiting on each other forever. ¦ Cycle in the lock-wait graph; Postgres aborts one participant. ¦ ERROR: deadlock detected
Isolation level ¦ postgres ¦ w2d5 ¦ How much concurrent transactions can see of each other. ¦ READ COMMITTED, REPEATABLE READ or SERIALIZABLE semantics. ¦ SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
Logical replication ¦ postgres ¦ w2d6 ¦ Copy chosen tables as row changes. ¦ Publish/subscribe replication decoding WAL into row-level changes. ¦ CREATE PUBLICATION p FOR TABLE shifts;
Schema ¦ postgres ¦ w3d1 ¦ A folder for tables inside a database. ¦ Namespace containing tables, functions and types. ¦ CREATE SCHEMA app;
search_path ¦ postgres ¦ w3d1 ¦ The list of schemas Postgres searches for names. ¦ Setting listing schemas used to resolve unqualified object names, in order. ¦ SET search_path = app, public;
Role ¦ security ¦ w3d1 ¦ A user or group inside Postgres. ¦ Database principal that can own objects and hold privileges; LOGIN makes it a user. ¦ CREATE ROLE app LOGIN;
GRANT ¦ security ¦ w3d1 ¦ Give a permission. ¦ Statement adding privileges on objects to roles. ¦ GRANT SELECT ON shifts TO reader;
REVOKE ¦ security ¦ w3d1 ¦ Take a permission away. ¦ Statement removing previously granted privileges. ¦ REVOKE ALL ON shifts FROM PUBLIC;
Least privilege ¦ security ¦ w3d1 ¦ Give only the access a job needs. ¦ Principle that each principal holds the minimum privileges for its task. ¦ The app role cannot DROP tables
PUBLIC ¦ security ¦ w3d1 ¦ The built-in "everyone" group. ¦ Implicit role every other role belongs to. ¦ REVOKE CREATE ON SCHEMA public FROM PUBLIC;
Authorization ¦ security ¦ w3d1 ¦ What you are allowed to do. ¦ Deciding which actions an authenticated principal may perform. ¦ GRANT and RLS policies
SQL injection ¦ security ¦ w3d1 ¦ An attack where user input becomes SQL code. ¦ Exploit where untrusted input is concatenated into query text. ¦ ' OR 1=1 --
Authentication ¦ security ¦ w3d2 ¦ Proving who you are. ¦ Verifying the identity of a principal. ¦ password, JWT, client certificate
pg_hba.conf ¦ security ¦ w3d2 ¦ The bouncer list: who may connect, from where, and how. ¦ Host-based authentication file whose rules are matched top-down by type, database, user, address, method. ¦ hostssl all all 0.0.0.0/0 scram-sha-256
SCRAM-SHA-256 ¦ security ¦ w3d2 ¦ Password login that never sends the password itself. ¦ Salted Challenge Response Authentication Mechanism using SHA-256. ¦ password_encryption = 'scram-sha-256'
md5 auth ¦ security ¦ w3d2 ¦ The old password method; avoid it. ¦ Legacy challenge based on MD5 of password+username; weaker than SCRAM. ¦ Migrate md5 → scram-sha-256
TLS ¦ security ¦ w3d2 ¦ Encrypts traffic between client and server. ¦ Transport Layer Security protocol providing encryption and server authentication. ¦ ssl = on in postgresql.conf
sslmode ¦ security ¦ w3d2 ¦ The client setting for how strict TLS is. ¦ libpq parameter: disable, allow, prefer, require, verify-ca, verify-full. ¦ ?sslmode=verify-full
RLS ¦ security ¦ w3d3 ¦ A per-user row filter enforced by the database. ¦ Row Level Security: policies that add predicates to every query on a table. ¦ ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
Policy ¦ security ¦ w3d3 ¦ One RLS rule. ¦ CREATE POLICY object defining USING/WITH CHECK expressions per command and role. ¦ CREATE POLICY own ON shifts USING (worker_id = auth.uid());
USING clause ¦ security ¦ w3d3 ¦ Which existing rows you can see or touch. ¦ RLS predicate applied to rows being read, updated or deleted. ¦ USING (tenant_id = current_setting('app.tenant')::int)
WITH CHECK ¦ security ¦ w3d3 ¦ Which new rows you are allowed to write. ¦ RLS predicate validating rows produced by INSERT or UPDATE. ¦ WITH CHECK (worker_id = auth.uid())
BYPASSRLS ¦ security ¦ w3d3 ¦ A role flag that ignores RLS. ¦ Role attribute that skips all row security policies; superusers have it implicitly. ¦ Supabase service_role
FORCE ROW LEVEL SECURITY ¦ security ¦ w3d3 ¦ Makes RLS apply to the table owner too. ¦ Table option subjecting the owner to its policies. ¦ ALTER TABLE shifts FORCE ROW LEVEL SECURITY;
SECURITY DEFINER ¦ security ¦ w3d3 ¦ A function that runs with its creator's rights. ¦ Function executing with its owner's privileges; pin search_path to avoid hijacking. ¦ CREATE FUNCTION f() ... SECURITY DEFINER SET search_path = ''
JWT ¦ security ¦ w3d4 ¦ A signed token that says who you are. ¦ JSON Web Token: base64url header.payload.signature. ¦ eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOi...
Claims ¦ security ¦ w3d4 ¦ The facts written inside a JWT. ¦ JSON payload fields such as sub, role, exp, aud and custom data. ¦ {"sub": "uuid", "role": "authenticated"}
OAuth 2.0 ¦ security ¦ w3d4 ¦ Lets an app act for you without your password. ¦ Authorization framework issuing access tokens through grant flows. ¦ "Sign in with Google"
OpenID Connect ¦ security ¦ w3d4 ¦ The login layer on top of OAuth. ¦ Identity layer adding an ID token (a JWT) to OAuth 2.0. ¦ id_token
Access token ¦ security ¦ w3d4 ¦ A short-lived key for calling an API. ¦ Credential presented as a Bearer token to resource servers. ¦ Authorization: Bearer eyJ...
Refresh token ¦ security ¦ w3d4 ¦ A long-lived ticket for getting new access tokens. ¦ Credential exchanged at the token endpoint for fresh access tokens. ¦ supabase.auth.refreshSession()
auth.uid() ¦ security ¦ w3d4 ¦ Supabase function returning the current user's id. ¦ Returns the sub claim of request.jwt.claims as a uuid. ¦ USING (user_id = auth.uid())
anon key ¦ security ¦ w3d4 ¦ Supabase's public key; RLS is what protects your data. ¦ JWT with role anon; safe in browsers only when RLS is enabled. ¦ NEXT_PUBLIC_SUPABASE_ANON_KEY
service_role key ¦ security ¦ w3d4 ¦ Supabase's master key that bypasses RLS. Server only. ¦ JWT with role service_role, which has BYPASSRLS. ¦ Never ship it in client code
MFA ¦ security ¦ w3d4 ¦ A second proof as well as the password. ¦ Multi-factor authentication: something you know, have or are. ¦ TOTP code from an authenticator app
Hashing ¦ security ¦ w3d5 ¦ A one-way fingerprint of data. ¦ Deterministic one-way function; passwords need slow, salted hashes. ¦ crypt('pw', gen_salt('bf'))
Salt ¦ security ¦ w3d5 ¦ Random extra data so equal passwords hash differently. ¦ Random per-secret value combined with the input before hashing. ¦ gen_salt('bf')
Encryption at rest ¦ security ¦ w3d5 ¦ Data on disk is scrambled. ¦ Encryption applied to persisted storage (disk, volume or column). ¦ Encrypted EBS volumes; pgp_sym_encrypt for columns
pgcrypto ¦ security ¦ w3d5 ¦ Postgres's crypto toolkit. ¦ Extension providing digest, hmac, crypt and pgp_sym_encrypt functions. ¦ SELECT pgp_sym_encrypt('note', 'key');
pgAudit ¦ security ¦ w3d5 ¦ Logs who did what in the database. ¦ Extension producing detailed session and object audit logs. ¦ pgaudit.log = 'write, ddl'
Audit trail ¦ security ¦ w3d5 ¦ A record of who did what and when. ¦ Append-only log of security-relevant events. ¦ audit_log table filled by a trigger
APPs ¦ security ¦ w3d6 ¦ Australia's 13 privacy rules. ¦ Australian Privacy Principles under the Privacy Act 1988 (Cth). ¦ APP 11: security of personal information
Notifiable Data Breaches ¦ security ¦ w3d6 ¦ You must tell people about serious data leaks. ¦ NDB scheme requiring notice to the OAIC and affected individuals for eligible breaches. ¦ Report within 30 days of assessment
Multi-tenancy ¦ security ¦ w3d7 ¦ Many customers share one system without seeing each other's data. ¦ Architecture isolating tenants' data in shared infrastructure (row, schema or database level). ¦ tenant_id column + RLS
Secrets management ¦ security ¦ w4d5 ¦ Keep keys and passwords out of your code. ¦ Storing credentials in a vault or environment and injecting them at runtime. ¦ Vercel environment variables
Threat model ¦ security ¦ w4d6 ¦ A list of what could go wrong and how you defend it. ¦ Structured analysis of assets, threats and mitigations (e.g. STRIDE). ¦ STRIDE table for the RAG app
Prompt injection ¦ security ¦ w4d4 ¦ Text that tricks an LLM into ignoring its rules. ¦ Untrusted input that alters model instructions or tool use. ¦ "Ignore previous instructions and ..."
Shell ¦ linux ¦ w1d1 ¦ The program that runs the commands you type. ¦ Command interpreter (bash, zsh) that parses and executes command lines and scripts. ¦ bash
Terminal ¦ linux ¦ w1d1 ¦ The window where you talk to the shell. ¦ Terminal emulator providing text input/output to a shell process. ¦ macOS Terminal, iTerm2
PATH ¦ linux ¦ w1d1 ¦ The folders searched when you type a command. ¦ Environment variable: colon-separated directories searched for executables. ¦ echo $PATH
Environment variable ¦ linux ¦ w1d1 ¦ A setting passed into programs. ¦ KEY=value pair in a process environment, inherited by child processes. ¦ DATABASE_URL=postgres://...
export ¦ linux ¦ w1d1 ¦ Makes a variable visible to programs you start. ¦ Marks a shell variable for inclusion in child process environments. ¦ export PGPASSWORD=dev
sudo ¦ linux ¦ w1d1 ¦ Run a command as the admin. ¦ Executes a command as another user (root by default) per the sudoers policy. ¦ sudo apt install postgresql-client
Port ¦ linux ¦ w1d1 ¦ A numbered door on a machine for network traffic. ¦ 16-bit TCP/UDP endpoint number identifying a service. ¦ Postgres listens on 5432
Pipe ¦ linux ¦ w1d3 ¦ Feed one command's output into the next. ¦ The | operator connects stdout of the left command to stdin of the right. ¦ cat app.log | grep ERROR
stdin / stdout / stderr ¦ linux ¦ w1d3 ¦ Input, normal output and error output. ¦ File descriptors 0, 1 and 2 of every process. ¦ cmd 2>/dev/null
Redirect ¦ linux ¦ w1d3 ¦ Send output into a file (or read from one). ¦ > truncates, >> appends, < reads a file as stdin. ¦ echo hi > a.txt
Exit code ¦ linux ¦ w1d3 ¦ A number saying success (0) or failure (anything else). ¦ Process status 0–255; $? holds the last one. ¦ grep -q x f; echo $?
Shebang ¦ linux ¦ w1d3 ¦ The first line saying which program runs the script. ¦ #! line read by the kernel's exec to choose the interpreter. ¦ #!/usr/bin/env bash
chmod ¦ linux ¦ w1d3 ¦ Changes file permissions. ¦ Sets mode bits (rwx) for user, group and others. ¦ chmod +x backup.sh
Permissions (rwx) ¦ linux ¦ w1d3 ¦ Read, write and execute flags on a file. ¦ Mode bits per owner/group/others, e.g. 755 = rwxr-xr-x. ¦ -rwxr-xr-x 1 hasan hasan backup.sh
set -euo pipefail ¦ linux ¦ w1d3 ¦ Bash "strict mode": stop at the first problem. ¦ -e exits on error, -u errors on unset variables, pipefail fails a pipeline if any stage fails. ¦ First line after the shebang
grep ¦ linux ¦ w1d3 ¦ Search text for a pattern. ¦ Prints lines matching a regular expression. ¦ grep -i error app.log
Regex ¦ linux ¦ w1d3 ¦ A pattern language for matching text. ¦ Regular expression syntax describing sets of strings. ¦ ^ERROR.*timeout$
Command substitution ¦ linux ¦ w1d3 ¦ Use a command's output inside another command. ¦ $(cmd) is replaced by cmd's stdout with trailing newlines removed. ¦ TODAY=$(date +%F)
for loop ¦ linux ¦ w1d3 ¦ Repeat commands for each item in a list. ¦ for NAME in WORDS; do COMMANDS; done ¦ for f in *.log; do wc -l "$f"; done
Quoting ¦ linux ¦ w1d3 ¦ Quotes stop bash splitting or expanding text. ¦ '...' is literal; "..." allows $ expansion but no word splitting. ¦ echo "$HOME" vs echo '$HOME'
cron ¦ linux ¦ w1d7 ¦ The scheduler for repeating jobs. ¦ Daemon running commands per crontab lines: minute hour day-of-month month day-of-week. ¦ 30 2 * * * /home/hasan/backup.sh
SSH ¦ linux ¦ w1d7 ¦ A secure remote terminal. ¦ Encrypted protocol for remote login and commands, typically with key auth. ¦ ssh hasan@db.example.com
SSH key ¦ linux ¦ w1d7 ¦ A key pair used instead of a password. ¦ Asymmetric key pair; the public key goes on the server, the private key stays local. ¦ ssh-keygen -t ed25519
Process ¦ linux ¦ w2d5 ¦ A running program. ¦ Executing instance with a PID, memory and open file descriptors. ¦ ps aux | grep postgres
curl ¦ linux ¦ w4d1 ¦ Make web requests from the terminal. ¦ CLI that transfers data to or from URLs. ¦ curl localhost:11434/api/tags
Container ¦ docker ¦ w1d1 ¦ A packaged app running in isolation. ¦ Process isolated with namespaces and cgroups, started from an image. ¦ docker run -d postgres:17
Image ¦ docker ¦ w1d1 ¦ The template a container is started from. ¦ Read-only layered filesystem plus run configuration. ¦ postgres:17
Port mapping ¦ docker ¦ w1d1 ¦ Connects a port on your laptop to a port in the container. ¦ -p host:container publishes a container port on the host. ¦ -p 5432:5432
Dockerfile ¦ docker ¦ w2d7 ¦ The recipe for building an image. ¦ Text file of build instructions (FROM, RUN, COPY, CMD). ¦ FROM python:3.12-slim
Volume ¦ docker ¦ w2d7 ¦ Storage that survives the container being deleted. ¦ Docker-managed persistent mount. ¦ -v pgdata:/var/lib/postgresql/data
Docker Compose ¦ docker ¦ w2d7 ¦ Run a whole multi-container stack from one file. ¦ Tool defining services, networks and volumes in compose.yaml. ¦ docker compose up -d
Healthcheck ¦ docker ¦ w2d7 ¦ Docker keeps testing whether a service is ready. ¦ Command run periodically to mark a container healthy or unhealthy. ¦ test: ["CMD", "pg_isready"]
Repository ¦ git ¦ w1d7 ¦ A project folder with its full history. ¦ Directory whose .git folder stores objects and refs. ¦ git init
Commit ¦ git ¦ w1d7 ¦ A saved snapshot with a message. ¦ Object recording a tree, parent commit(s), author and message. ¦ git commit -m "feat: shifts cli"
Branch ¦ git ¦ w1d7 ¦ A separate line of work. ¦ Movable pointer to a commit. ¦ git switch -c feature/cli
Staging area ¦ git ¦ w1d7 ¦ Where you pick what goes into the next commit. ¦ The index: a file listing content for the next commit. ¦ git add app.py
Remote ¦ git ¦ w1d7 ¦ The copy of your repo on GitHub. ¦ Named URL of another repository. ¦ origin
Pull request ¦ git ¦ w1d7 ¦ A request to merge your branch, with review. ¦ GitHub feature proposing and discussing a merge between branches. ¦ gh pr create
Merge conflict ¦ git ¦ w1d7 ¦ Two edits hit the same lines; you choose. ¦ State where git cannot combine changes automatically. ¦ <<<<<<< HEAD
.gitignore ¦ git ¦ w1d7 ¦ Files git should never track. ¦ Pattern file excluding paths from tracking. ¦ .env
LLM ¦ llm ¦ w4d1 ¦ An AI model that writes text by predicting what comes next. ¦ Large language model: a transformer trained to predict the next token. ¦ llama3.2
Token ¦ llm ¦ w4d1 ¦ The chunk of text a model counts and bills by. ¦ Unit produced by the tokenizer (≈ ¾ of an English word). ¦ "unbelievable" → 3 tokens
Context window ¦ llm ¦ w4d1 ¦ How much text the model can see at once. ¦ Maximum tokens of prompt plus output per request. ¦ 128k tokens
Temperature ¦ llm ¦ w4d1 ¦ The randomness dial. ¦ Sampling parameter scaling logits; 0 is near-deterministic. ¦ temperature=0 for evals
Ollama ¦ llm ¦ w4d1 ¦ Runs LLMs on your own machine. ¦ Local model runner exposing a REST API on port 11434. ¦ ollama run llama3.2
Quantization ¦ llm ¦ w4d1 ¦ Shrinks a model by storing numbers with fewer bits. ¦ Storing weights in lower precision (e.g. 4-bit). ¦ q4_K_M
Streaming ¦ llm ¦ w4d1 ¦ Show the answer as it is being written. ¦ Sending tokens incrementally (server-sent events / chunked HTTP). ¦ FastAPI StreamingResponse
System prompt ¦ llm ¦ w4d1 ¦ Standing instructions for the model. ¦ Highest-priority message that sets the model's behaviour. ¦ "Answer only from the context."
Embedding ¦ llm ¦ w4d2 ¦ Text turned into numbers so similar meanings sit close together. ¦ Dense vector representation where semantic similarity ≈ vector proximity. ¦ 768 floats from nomic-embed-text
Vector database ¦ llm ¦ w4d2 ¦ A database that finds the nearest vectors. ¦ Store with approximate-nearest-neighbour indexes over embeddings. ¦ Postgres + pgvector
pgvector ¦ llm ¦ w4d2 ¦ Vectors inside Postgres. ¦ Extension adding the vector type, distance operators and HNSW/IVFFlat indexes. ¦ embedding vector(768)
Cosine distance ¦ llm ¦ w4d2 ¦ How different two vectors' directions are. ¦ 1 − cosine similarity; pgvector operator <=>. ¦ ORDER BY embedding <=> $1
ANN ¦ llm ¦ w4d2 ¦ Fast "close enough" nearest-neighbour search. ¦ Approximate nearest-neighbour search trading a little recall for speed. ¦ HNSW, IVFFlat
HNSW ¦ llm ¦ w4d2 ¦ A graph index for fast vector search. ¦ Hierarchical Navigable Small World graph; tuned with m, ef_construction, ef_search. ¦ USING hnsw (embedding vector_cosine_ops)
IVFFlat ¦ llm ¦ w4d2 ¦ Group vectors into buckets, then search the closest buckets. ¦ Inverted-file index with k-means lists; probes controls recall. ¦ WITH (lists = 100); SET ivfflat.probes = 10;
Recall ¦ llm ¦ w4d2 ¦ The share of true matches your search found. ¦ Fraction of relevant items retrieved. ¦ recall@10 = 0.92
Chunking ¦ llm ¦ w4d2 ¦ Splitting documents into small pieces. ¦ Segmenting text into passages before embedding. ¦ 500 tokens with 50 overlap
RAG ¦ llm ¦ w4d2 ¦ Look things up first, then answer from them. ¦ Retrieval-Augmented Generation: retrieved passages are inserted into the prompt. ¦ retrieve → prompt → answer with citations
Full-text search ¦ llm ¦ w4d3 ¦ Keyword search that understands word forms. ¦ tsvector/tsquery matching with stemming and ranking. ¦ to_tsvector('english', body) @@ plainto_tsquery('incident')
Hybrid search ¦ llm ¦ w4d3 ¦ Keyword search and meaning search combined. ¦ Fusion of full-text and vector rankings. ¦ RRF over both result lists
RRF ¦ llm ¦ w4d3 ¦ A fair way to merge two ranked lists. ¦ Reciprocal Rank Fusion: score = Σ 1/(k + rank), usually k = 60. ¦ 1/(60+1) + 1/(60+3)
Reranker ¦ llm ¦ w4d3 ¦ A second model that re-sorts the top results. ¦ Cross-encoder scoring each query–document pair. ¦ bge-reranker
Citation ¦ llm ¦ w4d3 ¦ The answer shows which source it used. ¦ Reference to the ids of the retrieved passages. ¦ "Report within 24 hours [chunk 12]"
Hallucination ¦ llm ¦ w4d4 ¦ A confident answer that is made up. ¦ Output not supported by the input context or by facts. ¦ An invented policy number
Evals ¦ llm ¦ w4d4 ¦ Tests for AI answers. ¦ Systematic measurement of model output quality against a dataset. ¦ 30 question/answer pairs scored nightly
Faithfulness ¦ llm ¦ w4d4 ¦ Is the answer backed by the retrieved text? ¦ Metric: fraction of answer claims supported by the context. ¦ Ragas faithfulness = 0.94
Ground truth ¦ llm ¦ w4d4 ¦ The known correct answer. ¦ Reference label used to score outputs. ¦ expected = "24 hours"
Fine-tuning ¦ llm ¦ w4d4 ¦ Further training a model on your own examples. ¦ Updating model weights on task-specific data. ¦ LoRA adapter
Serverless function ¦ llm ¦ w4d5 ¦ Code that runs only when a request arrives. ¦ Stateless function invoked per request by the platform. ¦ app/api/ask/route.ts on Vercel
NEXT_PUBLIC_ ¦ llm ¦ w4d5 ¦ Prefix that exposes a variable to the browser. ¦ Next.js inlines these environment variables into client bundles. ¦ NEXT_PUBLIC_SUPABASE_URL
Guardrails ¦ llm ¦ w4d6 ¦ Checks wrapped around the model. ¦ Input/output filters and policies constraining model behaviour. ¦ Block personal data in outputs
Agent ¦ llm ¦ w4d6 ¦ An LLM that calls tools in a loop to reach a goal. ¦ Model iteratively choosing actions/tools and reading their results. ¦ search → read → answer
Tool calling ¦ llm ¦ w4d6 ¦ The LLM asks your code to run a function. ¦ Model emits a structured call (name + JSON arguments) that the app executes. ¦ {"name": "search_policies", "arguments": {...}}
`;
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export const terms: Term[] = RAW.trim().split('\n').map((l) => {
  const [term, cat, day, plain, literal, example] = l.split(' ¦ ').map((x) => x.trim());
  return { id: slugify(term), term, cat, day, week: +day[1], plain, literal, example };
});
export const termCats = ['python', 'sql', 'postgres', 'security', 'linux', 'docker', 'git', 'llm'];
