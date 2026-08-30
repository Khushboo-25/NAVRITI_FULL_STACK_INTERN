const client = require("../config/cassandra");

async function createPortal(portal) {
  const result = await client.execute(
    `
      INSERT INTO announcement_portal
      (id, name, description, created_by, target_audience, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
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
  const result = await client.execute(
    `
      SELECT *
      FROM announcement_portal
      WHERE id = ?
    `,
    [id],
    { prepare: true }
  );

  return result.rows[0] || null;
}

async function deletePortal(id) {
  await client.execute(
    `
      DELETE FROM announcement_portal
      WHERE id = ?
    `,
    [id],
    { prepare: true }
  );
}

module.exports = {
  createPortal,
  getPortalById,
  deletePortal,
};