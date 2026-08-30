const client = require("../config/cassandra");

async function addMember(member) {
  const queries = [
    {
      query: `
        INSERT INTO announcement_portal_member_by_portal
        (portal_id, user_id, role, added_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      params: [
        member.portal_id,
        member.user_id,
        member.role,
        member.added_by,
        member.created_at,
        member.updated_at,
      ],
    },
    {
      query: `
        INSERT INTO announcement_portal_member_by_user
        (user_id, portal_id, role, created_at)
        VALUES (?, ?, ?, ?)
      `,
      params: [
        member.user_id,
        member.portal_id,
        member.role,
        member.created_at,
      ],
    },
  ];

  await Promise.all(
    queries.map(({ query, params }) =>
      client.execute(query, params, { prepare: true })
    )
  );

  return member;
}

async function getMembersByPortal(portalId) {
  const result = await client.execute(
    `
      SELECT *
      FROM announcement_portal_member_by_portal
      WHERE portal_id = ?
    `,
    [portalId],
    { prepare: true }
  );

  return result.rows;
}

async function getPortalsByUser(userId) {
  const result = await client.execute(
    `
      SELECT *
      FROM announcement_portal_member_by_user
      WHERE user_id = ?
    `,
    [userId],
    { prepare: true }
  );

  return result.rows;
}

async function removeMember(portalId, userId) {
  await Promise.all([
    client.execute(
      `
        DELETE FROM announcement_portal_member_by_portal
        WHERE portal_id = ? AND user_id = ?
      `,
      [portalId, userId],
      { prepare: true }
    ),

    client.execute(
      `
        DELETE FROM announcement_portal_member_by_user
        WHERE user_id = ? AND portal_id = ?
      `,
      [userId, portalId],
      { prepare: true }
    ),
  ]);
}
async function updateMemberRole(
  portalId,
  userId,
  role,
  updatedAt
) {
  await Promise.all([
    client.execute(
      `
        UPDATE announcement_portal_member_by_portal
        SET role = ?, updated_at = ?
        WHERE portal_id = ? AND user_id = ?
      `,
      [role, updatedAt, portalId, userId],
      { prepare: true }
    ),

    client.execute(
      `
        UPDATE announcement_portal_member_by_user
        SET role = ?
        WHERE user_id = ? AND portal_id = ?
      `,
      [role, userId, portalId],
      { prepare: true }
    ),
  ]);
}

module.exports = {
  addMember,
  getMembersByPortal,
  getPortalsByUser,
  removeMember,
  updateMemberRole,
};