const client = require("../config/cassandra");

async function createPortal(portal) {
  const query = `
    INSERT INTO announcement_portal
    (id, name, description, created_by, target_audience, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  await client.execute(
    query,
    [
      portal.id,
      portal.name,
      portal.description,
      portal.created_by,
      portal.target_audience,
      portal.created_at,
      portal.updated_at,
    ],
    { prepare: true }
  );

  return portal;
}

async function getPortalById(id) {
  const query = `
    SELECT *
    FROM announcement_portal
    WHERE id = ?
  `;

  const result = await client.execute(query, [id], { prepare: true });

  return result.rows[0] || null;
}

async function deletePortal(id) {
  const query = `
    DELETE FROM announcement_portal
    WHERE id = ?
  `;

  await client.execute(query, [id], { prepare: true });
}

module.exports = {
  createPortal,
  getPortalById,
  deletePortal,
};