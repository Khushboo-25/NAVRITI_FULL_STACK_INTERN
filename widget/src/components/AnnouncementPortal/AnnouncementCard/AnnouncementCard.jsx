import AnnouncementAttachments
    from "../AnnouncementAttachments/AnnouncementAttachments";

import "./AnnouncementCard.css";

const formatDate = (date) => {
    if (!date) {
        return "";
    }

    return new Date(date).toLocaleString();
};


function AnnouncementCard({
    announcement,
    canManage,
    onDelete,
}) {

    const handleDelete = () => {

        const confirmed =
            window.confirm(
                "Are you sure you want to delete this announcement?"
            );

        if (!confirmed) {
            return;
        }

        onDelete(
            announcement._id
        );
    };


    return (
        <article className="announcement-card">

            {/* =================================
                Header
            ================================== */}

            <div className="announcement-card-header">

                <div className="announcement-card-heading">

                    <h3>
                        {announcement.title}
                    </h3>

                    <div className="announcement-meta">

                        <span>
                            By {announcement.senderId}
                        </span>

                        <span>
                            •
                        </span>

                        <span>
                            {
                                formatDate(
                                    announcement.publishedAt
                                )
                            }
                        </span>

                    </div>

                </div>


                {/* Delete */}

                {canManage && (
                    <button
                        type="button"
                        className="announcement-delete-button"
                        onClick={
                            handleDelete
                        }
                    >
                        Delete
                    </button>
                )}

            </div>


            {/* =================================
                Content
            ================================== */}

            <div className="announcement-card-content">

                {announcement.content}

            </div>


            {/* =================================
                Audience
            ================================== */}

            <div className="announcement-audience">

                <span className="announcement-audience-label">
                    Audience:
                </span>

                <span>
                    {
                        announcement.targetAudience ===
                        "all"
                            ? "Everyone"
                            : "Selected users"
                    }
                </span>

            </div>


            {/* =================================
                Attachments
            ================================== */}

            <AnnouncementAttachments
                attachments={
                    announcement.attachments
                }
            />

        </article>
    );
}

export default AnnouncementCard;