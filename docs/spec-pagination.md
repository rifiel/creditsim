## Plan: Add Pagination to Simulation History

**TL;DR** — Add offset-based pagination (10 items/page) across all layers: a new paginated DB method with `LIMIT`/`OFFSET`, updated API endpoint accepting `page` query param and returning pagination metadata, frontend pagination controls using Bootstrap 5's pagination component (hidden when ≤10 total simulations), and tests covering the new behavior.

**Steps**

1. **Add paginated DB method** in `src/database/database.js`
   - Add `getCustomersPaginated(page, limit)` that runs `SELECT * FROM customers ORDER BY createdAt DESC LIMIT ? OFFSET ?` and a separate `SELECT COUNT(*) FROM customers` for total count
   - Return `{ simulations, total }` from the method
   - Keep existing `getAllCustomers()` intact for backward compat

2. **Update API route** in `src/routes/simulation.js`
   - Modify `GET /api/simulations` to accept optional `?page=1` query param (default: 1), with a fixed limit of 10
   - Validate `page` is a positive integer; return 400 on invalid values
   - Call the new `getCustomersPaginated()` method
   - Return response shape: `{ count, page, totalPages, simulations }` where `count` is the total number of simulations (not just the page), `page` is current page, and `totalPages` is `Math.ceil(count / 10)`

3. **Update frontend JS** in `public/app.js`
   - Add `currentPage` property (default 1) to the `CreditSimulator` class
   - Update `loadSimulations()` to pass `?page=${this.currentPage}` to the API
   - Store `totalPages` from the response
   - Add `renderPagination(currentPage, totalPages)` method that builds a Bootstrap 5 `<nav><ul class="pagination">` with Previous/Next and numbered page buttons
   - Hide pagination entirely when `totalPages <= 1` (i.e., total simulations ≤ 10)
   - Attach click handlers to pagination buttons that update `currentPage` and call `loadSimulations()`
   - After a new simulation is submitted, reset `currentPage = 1` before reloading

4. **Update frontend HTML** in `public/index.html`
   - Add a `<div id="paginationContainer">` below the `#simulationsList` div, inside the Previous Simulations card

5. **Update API spec** in `docs/api.yaml`
   - Add `page` query parameter to `GET /simulations`
   - Update response schema to include `page`, `totalPages` fields

6. **Add/update tests** in `tests/api.test.js`
   - Test default pagination (no `page` param → page 1, limit 10)
   - Test explicit `?page=2` returns correct offset
   - Test response includes `page`, `totalPages`, `count`
   - Test invalid page values (0, negative, non-numeric) return 400
   - Test that when fewer than 10 simulations exist, all are returned on page 1
   - Test out-of-range page returns empty `simulations` array with correct metadata

**Verification**
- Run `npm test` to execute all Jest/Supertest tests
- Manually verify: create >10 simulations → pagination appears with correct page count; create <10 → no pagination shown
- Verify clicking Previous/Next/page numbers updates the displayed simulations
- Verify new simulation submission resets to page 1

**Decisions**
- **Offset-based over cursor-based pagination**: Simpler, supports numbered pages in UI, sufficient for SQLite at this scale
- **Fixed page size of 10**: Per requirement, no user-configurable limit needed
- **Keep `getAllCustomers()` method**: Avoids breaking any other code that may depend on it
- **Response shape keeps `count` as total**: Maintains semantic meaning — `count` = total simulations across all pages, not just the current page
