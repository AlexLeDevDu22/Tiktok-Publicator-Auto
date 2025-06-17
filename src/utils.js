/**
 * Fetches all accounts in the database or a specific one.
 *
 * @param {mysql2/promise} db - The database connection
 * @param {string} id - The ID of the account. If set to '*', all accounts are returned.
 * @returns {Promise<Array<Object>>} - The result of the query with the account(s) data
 */
async function getAccountsData(db, id, onlyActive = false) {
  let query = "SELECT * FROM `accounts`";
  let conditions = [];
  let params = [];

  if (id !== "*") {
    conditions.push("id = ?");
    params.push(id);
  }

  if (onlyActive) {
    conditions.push("active = 1");
  }

  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }

  const [rows] = await db.query(query, params);
  return id == "*" ? rows : rows[0];
}

module.exports = {
  getAccountsData,
};
