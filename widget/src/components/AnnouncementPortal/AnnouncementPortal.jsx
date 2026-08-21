import { useEffect, useState } from "react";

import {
    getUserAnnouncementPortals,
    getAnnouncements,
    createAnnouncement,
    deleteAnnouncement,
} from "../../services/announcementPortalService";

import AnnouncementList from "./AnnouncementList/AnnouncementList.jsx";
import CreateAnnouncementModal
    from "./CreateAnnouncementModal/CreateAnnouncementModal.jsx";

import "./AnnouncementPortal.css";

function AnnouncementPortal({
    currentUser,
    onBack,
}) {
    const userId = currentUser?.userId;

    const [portals, setPortals] = useState([]);
    const [selectedPortal, setSelectedPortal] = useState(null);

    const [announcements, setAnnouncements] = useState([]);

    const [loadingPortals, setLoadingPortals] =
        useState(true);

    const [loadingAnnouncements, setLoadingAnnouncements] =
        useState(false);

    const [error, setError] = useState("");

    const [isCreateModalOpen, setIsCreateModalOpen] =
        useState(false);


    /*
     * --------------------------------------------------
     * Load announcement portals
     * --------------------------------------------------
     */

    useEffect(() => {
        if (!userId) {
            return;
        }

        const loadPortals = async () => {
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

                if (data.length > 0) {
                    setSelectedPortal(data[0]);
                } else {
                    setSelectedPortal(null);
                }

            } catch (error) {
                console.error(
                    "Failed to load announcement portals:",
                    error
                );

                setError(
                    "Failed to load announcement portals"
                );
            } finally {
                setLoadingPortals(false);
            }
        };

        loadPortals();

    }, [userId]);


    /*
     * --------------------------------------------------
     * Load announcements
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

                setError(
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
     * Create announcement
     * --------------------------------------------------
     */

    const handleCreateAnnouncement = async ({
        title,
        content,
        targetAudience,
        files,
    }) => {

        if (!selectedPortal) {
            return;
        }

        const formData = new FormData();

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

        files.forEach((file) => {
            formData.append(
                "attachments",
                file
            );
        });

        
        const announcement =
            await createAnnouncement(
                selectedPortal._id,
                formData
            );

        setAnnouncements((prev) => [
            announcement,
            ...prev,
        ]);

        setIsCreateModalOpen(false);
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

            await deleteAnnouncement(
                selectedPortal._id,
                announcementId,
                userId
            );

            setAnnouncements((prev) =>
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
     * Loading portals
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


            {/* =========================================
                Portal selector
            ========================================== */}

            {portals.length > 0 && (
                <div className="announcement-portals">

                    <div className="announcement-portal-label">
                        Portals
                    </div>

                    <div className="announcement-portal-list">

                        {portals.map((portal) => {

                            const isSelected =
                                selectedPortal?._id ===
                                portal._id;

                            return (
                                <button
                                    key={portal._id}
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
                                        {portal.name}
                                    </span>

                                    <small>
                                        {portal.role}
                                    </small>

                                </button>
                            );
                        })}

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

                    {/* Portal header */}

                    <div className="announcement-content-header">

                        <div>

                            <h3>
                                {selectedPortal.name}
                            </h3>

                            {selectedPortal.description && (
                                <p>
                                    {
                                        selectedPortal.description
                                    }
                                </p>
                            )}

                        </div>


                        {(selectedPortal.role === "host" ||
                            selectedPortal.role === "admin") && (

                            <button
                                type="button"
                                className="announcement-create-button"
                                onClick={() =>
                                    setIsCreateModalOpen(
                                        true
                                    )
                                }
                            >
                                + Announcement
                            </button>

                        )}

                    </div>


                    {/* Announcement list */}

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
                    />

                </div>
            )}


            {/* =========================================
                Create modal
            ========================================== */}

            <CreateAnnouncementModal
                isOpen={
                    isCreateModalOpen
                }
                onClose={() =>
                    setIsCreateModalOpen(
                        false
                    )
                }
                onCreate={
                    handleCreateAnnouncement
                }
            />

        </div>
    );
}

export default AnnouncementPortal;