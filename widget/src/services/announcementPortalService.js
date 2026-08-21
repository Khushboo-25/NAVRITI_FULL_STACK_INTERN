import { getApi } from "./api";


/*
 * Get all announcement portals
 * available to the current user.
 */
export const getUserAnnouncementPortals = async (
    userId
) => {
    const api = getApi();

    const response = await api.get(
        "/announcement-portals",
        {
            params: {
                userId,
            },
        }
    );

    return response.data || [];
};


/*
 * Get announcements for a portal.
 */
export const getAnnouncements = async (
    portalId,
    userId
) => {
    const api = getApi();

    const response = await api.get(
        `/announcement-portals/${portalId}/announcements`,
        {
            params: {
                userId,
            },
        }
    );

    return response.data.announcements || [];
};


/*
 * Get a single announcement.
 */
export const getAnnouncement = async (
    portalId,
    announcementId,
    userId
) => {
    const api = getApi();

    const response = await api.get(
        `/announcement-portals/${portalId}/announcements/${announcementId}`,
        {
            params: {
                userId,
            },
        }
    );

    return response.data.announcement;
};


/*
 * Create announcement.
 */
export const createAnnouncement = async (
    portalId,
    formData
) => {
    const api = getApi();

    const response = await api.post(
        `/announcement-portals/${portalId}/announcements`,
        formData,
        
    );

    return response.data.announcement;
};


/*
 * Update announcement.
 */
export const updateAnnouncement = async (
    portalId,
    announcementId,
    data
) => {
    const api = getApi();

    const response = await api.patch(
        `/announcement-portals/${portalId}/announcements/${announcementId}`,
        data
    );

    return response.data.announcement;
};


/*
 * Delete announcement.
 */
export const deleteAnnouncement = async (
    portalId,
    announcementId,
    userId
) => {
    const api = getApi();

    const response = await api.delete(
        `/announcement-portals/${portalId}/announcements/${announcementId}`,
        {
            params: {
                userId,
            },
        }
    );

    return response.data;
};