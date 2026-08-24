import { useEffect, useMemo, useState } from "react";

import {
    getUserAnnouncementPortals,
    getAnnouncements,
    createAnnouncement,
    deleteAnnouncement,
    createAnnouncementPortal,
    updateAnnouncement,
} from "../../services/announcementPortalService";

import AnnouncementList
    from "./AnnouncementList/AnnouncementList.jsx";

import CreateAnnouncementModal
    from "./CreateAnnouncementModal/CreateAnnouncementModal.jsx";

import CreatePortalModal
    from "./CreatePortalModal/CreatePortalModal.jsx";

import EditAnnouncementModal
    from "./EditAnnouncementModal/EditAnnouncementModal.jsx";

import "./AnnouncementPortal.css";


function AnnouncementPortal({
    currentUser,
    users = [],
    onBack,
}) {

    const userId =
        currentUser?.userId;

    const userRole =
        currentUser?.role;


    /*
     * --------------------------------------------------
     * State
     * --------------------------------------------------
     */

    const [portals, setPortals] =
        useState([]);

    const [selectedPortal, setSelectedPortal] =
        useState(null);

    const [announcements, setAnnouncements] =
        useState([]);

    const [loadingPortals, setLoadingPortals] =
        useState(true);

    const [loadingAnnouncements, setLoadingAnnouncements] =
        useState(false);

    const [error, setError] =
        useState("");


    const [isCreatePortalOpen, setIsCreatePortalOpen] =
        useState(false);

    const [isCreateAnnouncementOpen, setIsCreateAnnouncementOpen] =
        useState(false);

    const [editingAnnouncement, setEditingAnnouncement] =
        useState(null);


    /*
     * --------------------------------------------------
     * Portal members available for announcements
     * --------------------------------------------------
     *
     * If the backend returns:
     *
     * selectedPortal.members
     *
     * we use those membership userIds to filter
     * the global users list.
     *
     * The userId is always preserved.
     * --------------------------------------------------
     */

    const announcementUsers = useMemo(() => {

        if (!selectedPortal) {
            return [];
        }


        /*
         * If backend provides members,
         * restrict the announcement picker
         * to actual portal members.
         */

        if (
            Array.isArray(
                selectedPortal.members
            )
        ) {

            const memberIds =
                selectedPortal.members
                    .map(
                        (member) =>
                            member.userId
                    )
                    .filter(Boolean);


            return users.filter(
                (user) =>
                    memberIds.includes(
                        user.userId
                    )
            );
        }


        /*
         * Current backend portal response
         * does not include members.
         *
         * Until membership is included,
         * use the supplied user list.
         *
         * Backend still validates selected
         * users before creating the announcement.
         */

        return users;

    }, [
        selectedPortal,
        users,
    ]);


    /*
     * --------------------------------------------------
     * Edit announcement
     * --------------------------------------------------
     */

    const handleEditAnnouncement = (
        announcement
    ) => {

        setEditingAnnouncement(
            announcement
        );
    };


    const handleUpdateAnnouncement = async ({
        title,
        content,
    }) => {

        if (
            !selectedPortal ||
            !editingAnnouncement
        ) {
            return;
        }


        try {

            setError("");


            const updatedAnnouncement =
                await updateAnnouncement(
                    selectedPortal._id,
                    editingAnnouncement._id,
                    {
                        userId,
                        title,
                        content,
                    }
                );


            setAnnouncements((prev) =>
                prev.map(
                    (announcement) =>
                        announcement._id ===
                        updatedAnnouncement._id
                            ? updatedAnnouncement
                            : announcement
                )
            );


            setEditingAnnouncement(null);

        } catch (error) {

            console.error(
                "Failed to update announcement:",
                error
            );


            setError(
                error?.response?.data?.message ||
                "Failed to update announcement"
            );

        }
    };


    /*
     * --------------------------------------------------
     * Load portals
     * --------------------------------------------------
     */

    const loadPortals = async () => {

        if (!userId) {
            return;
        }


        try {

            setLoadingPortals(true);
            setError("");


            const data =
                await getUserAnnouncementPortals(
                    userId
                );


            console.log(
                "Announcement portals:",
                data
            );


            setPortals(data);


            /*
             * Keep currently selected portal
             * if it still exists.
             */

            setSelectedPortal(
                (currentSelected) => {

                    if (!data.length) {
                        return null;
                    }


                    if (!currentSelected) {
                        return data[0];
                    }


                    const updatedPortal =
                        data.find(
                            (portal) =>
                                portal._id ===
                                currentSelected._id
                        );


                    return (
                        updatedPortal ||
                        data[0]
                    );
                }
            );

        } catch (error) {

            console.error(
                "Failed to load announcement portals:",
                error
            );


            setError(
                error?.response?.data?.message ||
                "Failed to load announcement portals"
            );

        } finally {

            setLoadingPortals(false);

        }
    };


    /*
     * --------------------------------------------------
     * Initial portal load
     * --------------------------------------------------
     */

    useEffect(() => {

        loadPortals();

    }, [userId]);


    /*
     * --------------------------------------------------
     * Load announcements when portal changes
     * --------------------------------------------------
     */

    useEffect(() => {

        if (
            !selectedPortal ||
            !userId
        ) {

            setAnnouncements([]);

            return;
        }


        const loadAnnouncements = async () => {

            try {

                setLoadingAnnouncements(true);
                setError("");


                const data =
                    await getAnnouncements(
                        selectedPortal._id,
                        userId
                    );


                setAnnouncements(data);

            } catch (error) {

                console.error(
                    "Failed to load announcements:",
                    error
                );


                console.error(
                    "Status:",
                    error?.response?.status
                );


                console.error(
                    "Backend response:",
                    error?.response?.data
                );


                setError(
                    error?.response?.data?.message ||
                    "Failed to load announcements"
                );

            } finally {

                setLoadingAnnouncements(false);

            }
        };


        loadAnnouncements();

    }, [
        selectedPortal,
        userId,
    ]);


    /*
     * --------------------------------------------------
     * Create portal
     * --------------------------------------------------
     */

    const handleCreatePortal = async ({
        name,
        description,
        targetAudience,
        members,
    }) => {

        try {

            setError("");


            const createdPortal =
                await createAnnouncementPortal({

                    name,

                    description,

                    userId,

                    role: userRole,
                    targetAudience,

                    members,

                });


            /*
             * Refresh portal list.
             */

            await loadPortals();


            /*
             * Select newly created portal.
             */

            setSelectedPortal(
                createdPortal
            );


            setIsCreatePortalOpen(
                false
            );

        } catch (error) {

            console.error(
                "Failed to create portal:",
                error
            );


            setError(
                error?.response?.data?.message ||
                "Failed to create announcement portal"
            );


            throw error;
        }
    };


    /*
     * --------------------------------------------------
     * Create announcement
     * --------------------------------------------------
     */

    const handleCreateAnnouncement = async ({
        title,
        content,
        targetAudience,
        targetUserIds,
        files = [],
    }) => {

        if (!selectedPortal) {
            return;
        }


        try {

            setError("");


            const formData =
                new FormData();


            formData.append(
                "senderId",
                userId
            );


            formData.append(
                "title",
                title
            );


            formData.append(
                "content",
                content
            );


            formData.append(
                "targetAudience",
                targetAudience
            );


            /*
             * Selected users.
             *
             * IMPORTANT:
             * These are actual userIds:
             *
             * ["user-14"]
             *
             * not display names.
             */

            if (
                targetAudience === "selected" &&
                Array.isArray(targetUserIds)
            ) {

                targetUserIds
                    .filter(Boolean)
                    .forEach(
                        (targetUserId) => {

                            formData.append(
                                "targetUserIds",
                                targetUserId
                            );

                        }
                    );
            }


            /*
             * Attachments
             */

            files.forEach(
                (file) => {

                    formData.append(
                        "attachments",
                        file
                    );

                }
            );


            console.log(
                "Creating announcement:",
                {
                    portalId:
                        selectedPortal._id,

                    targetAudience,

                    targetUserIds,
                }
            );


            const announcement =
                await createAnnouncement(
                    selectedPortal._id,
                    formData
                );


            setAnnouncements(
                (prev) => [
                    announcement,
                    ...prev,
                ]
            );


            setIsCreateAnnouncementOpen(
                false
            );

        } catch (error) {

            console.error(
                "Failed to create announcement:",
                error
            );


            console.error(
                "Status:",
                error?.response?.status
            );


            console.error(
                "Backend response:",
                error?.response?.data
            );


            setError(
                error?.response?.data?.message ||
                "Failed to create announcement"
            );


            throw error;
        }
    };


    /*
     * --------------------------------------------------
     * Delete announcement
     * --------------------------------------------------
     */

    const handleDeleteAnnouncement = async (
        announcementId
    ) => {

        if (!selectedPortal) {
            return;
        }


        try {

            setError("");


            await deleteAnnouncement(
                selectedPortal._id,
                announcementId,
                userId
            );


            setAnnouncements(
                (prev) =>
                    prev.filter(
                        (announcement) =>
                            announcement._id !==
                            announcementId
                    )
            );

        } catch (error) {

            console.error(
                "Failed to delete announcement:",
                error
            );


            setError(
                error?.response?.data?.message ||
                "Failed to delete announcement"
            );
        }
    };


    /*
     * --------------------------------------------------
     * No user
     * --------------------------------------------------
     */

    if (!userId) {

        return (

            <div className="announcement-portal">

                <div className="announcement-empty">

                    <h3>
                        User information unavailable
                    </h3>

                </div>

            </div>

        );
    }


    /*
     * --------------------------------------------------
     * Loading
     * --------------------------------------------------
     */

    if (loadingPortals) {

        return (

            <div className="announcement-portal">

                <div className="announcement-loading">

                    Loading announcements...

                </div>

            </div>

        );
    }


    return (

        <div className="announcement-portal">


            {/* =========================================
                Header
            ========================================== */}

            <div className="announcement-header">

                <div className="announcement-header-left">

                    <button
                        type="button"
                        className="announcement-back-button"
                        onClick={onBack}
                    >
                        ←
                    </button>


                    <div>

                        <h2>
                            Announcements
                        </h2>

                        <p>
                            Stay updated with the latest
                            announcements.
                        </p>

                    </div>

                </div>


                {/* Host/Admin can create portals */}

                {(userRole === "admin" ||
                    userRole === "host") && (

                    <button
                        type="button"
                        className="announcement-create-portal-button"
                        onClick={() =>
                            setIsCreatePortalOpen(
                                true
                            )
                        }
                    >
                        + Portal
                    </button>

                )}

            </div>


            {/* =========================================
                Portal selector
            ========================================== */}

            {portals.length > 0 && (

                <div className="announcement-portals">

                    <div className="announcement-portal-label">

                        Portals

                    </div>


                    <div className="announcement-portal-list">

                        {portals.map(
                            (portal) => {

                                const isSelected =
                                    selectedPortal?._id ===
                                    portal._id;


                                return (

                                    <button
                                        key={
                                            portal._id
                                        }
                                        type="button"
                                        className={`announcement-portal-item ${
                                            isSelected
                                                ? "active"
                                                : ""
                                        }`}
                                        onClick={() =>
                                            setSelectedPortal(
                                                portal
                                            )
                                        }
                                    >

                                        <span>
                                            {
                                                portal.name
                                            }
                                        </span>

                                        <small>
                                            {
                                                portal.role
                                            }
                                        </small>

                                    </button>

                                );

                            }
                        )}

                    </div>

                </div>

            )}


            {/* =========================================
                Error
            ========================================== */}

            {error && (

                <div className="announcement-error">

                    {error}

                </div>

            )}


            {/* =========================================
                No portals
            ========================================== */}

            {portals.length === 0 && (

                <div className="announcement-empty">

                    <div className="announcement-empty-icon">
                        📢
                    </div>


                    <h3>
                        No announcement portals
                    </h3>


                    <p>
                        You are not a member of any
                        announcement portal yet.
                    </p>

                </div>

            )}


            {/* =========================================
                Selected portal
            ========================================== */}

            {selectedPortal && (

                <div className="announcement-content">


                    <div className="announcement-content-header">

                        <div>

                            <div className="announcement-selected-portal-title-row">

                                <h3>
                                    {
                                        selectedPortal.name
                                    }
                                </h3>


                                <span
                                    className={`announcement-role-badge ${selectedPortal.role}`}
                                >
                                    {
                                        selectedPortal.role
                                    }
                                </span>

                            </div>


                            {selectedPortal.description && (

                                <p>
                                    {
                                        selectedPortal.description
                                    }
                                </p>

                            )}

                        </div>


                        {/* Host/Admin can create announcements */}

                        {(selectedPortal.role === "host" ||
                            selectedPortal.role === "admin") && (

                            <button
                                type="button"
                                className="announcement-create-button"
                                onClick={() =>
                                    setIsCreateAnnouncementOpen(
                                        true
                                    )
                                }
                            >
                                + Announcement
                            </button>

                        )}

                    </div>


                    <AnnouncementList
                        announcements={
                            announcements
                        }
                        selectedPortal={
                            selectedPortal
                        }
                        loading={
                            loadingAnnouncements
                        }
                        onDelete={
                            handleDeleteAnnouncement
                        }
                        onEdit={
                            handleEditAnnouncement
                        }
                    />

                </div>

            )}


            {/* =========================================
                Create Portal Modal
            ========================================== */}

            <CreatePortalModal
                isOpen={
                    isCreatePortalOpen
                }
                onClose={() =>
                    setIsCreatePortalOpen(
                        false
                    )
                }
                onCreate={
                    handleCreatePortal
                }
                users={
                    users
                }
                currentUser={
                    currentUser
                }
            />


            {/* =========================================
                Create Announcement Modal
            ========================================== */}

            <CreateAnnouncementModal
                isOpen={
                    isCreateAnnouncementOpen
                }
                onClose={() =>
                    setIsCreateAnnouncementOpen(
                        false
                    )
                }
                onCreate={
                    handleCreateAnnouncement
                }
                users={
                    announcementUsers
                }
                currentUser={
                    currentUser
                }
            />


            {/* =========================================
                Edit Announcement Modal
            ========================================== */}

            {editingAnnouncement && (

                <EditAnnouncementModal
                    isOpen={
                        Boolean(
                            editingAnnouncement
                        )
                    }
                    announcement={
                        editingAnnouncement
                    }
                    onClose={() =>
                        setEditingAnnouncement(
                            null
                        )
                    }
                    onUpdate={
                        handleUpdateAnnouncement
                    }
                />

            )}

        </div>

    );
}


export default AnnouncementPortal;