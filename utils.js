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
