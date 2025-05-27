/**
 * Fetches all accounts in the database or a specific one.
 *
 * @param {mysql2/promise} db - The database connection
 * @param {string} id - The ID of the account. If set to '*', all accounts are returned.
 * @returns {Promise<Array<Object>>} - The result of the query with the account(s) data
 */
async function getAccountsData(db, id) {
  let query = "SELECT * FROM `accounts`";
  let params = [];

  if (id !== "*") {
    query += " WHERE id = ?";
    params.push(id);
  }

  const [rows] = await db.query(query, params);
  return rows;
}

module.exports = {
  getAccountsData,
};
