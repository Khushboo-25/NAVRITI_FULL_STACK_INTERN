import { useState } from "react";

import "./CreateAnnouncementModal.css";


function CreateAnnouncementModal({
    isOpen,
    onClose,
    onCreate,
}) {

    const [title, setTitle] =
        useState("");

    const [content, setContent] =
        useState("");

    const [targetAudience, setTargetAudience] =
        useState("all");

    const [files, setFiles] =
        useState([]);

    const [submitting, setSubmitting] =
        useState(false);

    const [error, setError] =
        useState("");


    if (!isOpen) {
        return null;
    }


    const handleFileChange = (event) => {

        setFiles(
            Array.from(
                event.target.files || []
            )
        );
    };


    const handleSubmit = async (event) => {

        event.preventDefault();


        if (!title.trim()) {
            setError(
                "Title is required"
            );

            return;
        }


        if (!content.trim()) {
            setError(
                "Content is required"
            );

            return;
        }


        try {

            setSubmitting(true);
            setError("");


            await onCreate({
                title: title.trim(),
                content: content.trim(),
                targetAudience,
                files,
            });


            setTitle("");
            setContent("");
            setTargetAudience("all");
            setFiles([]);


        } catch (error) {

            console.error(
                "Failed to create announcement:",
                error
            );

            setError(
                "Failed to create announcement"
            );

        } finally {

            setSubmitting(false);

        }
    };


    return (
        <div className="announcement-modal-overlay">

            <div className="announcement-modal">

                {/* Header */}

                <div className="announcement-modal-header">

                    <h3>
                        Create Announcement
                    </h3>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                    >
                        ×
                    </button>

                </div>


                {/* Form */}

                <form
                    onSubmit={handleSubmit}
                    className="announcement-form"
                >

                    {error && (
                        <div className="announcement-form-error">
                            {error}
                        </div>
                    )}


                    {/* Title */}

                    <label>

                        Title

                        <input
                            type="text"
                            value={title}
                            onChange={(e) =>
                                setTitle(
                                    e.target.value
                                )
                            }
                            placeholder="Announcement title"
                            disabled={
                                submitting
                            }
                        />

                    </label>


                    {/* Content */}

                    <label>

                        Content

                        <textarea
                            value={content}
                            onChange={(e) =>
                                setContent(
                                    e.target.value
                                )
                            }
                            placeholder="Write your announcement..."
                            rows={6}
                            disabled={
                                submitting
                            }
                        />

                    </label>


                    {/* Audience */}

                    <label>

                        Audience

                        <select
                            value={
                                targetAudience
                            }
                            onChange={(e) =>
                                setTargetAudience(
                                    e.target.value
                                )
                            }
                            disabled={
                                submitting
                            }
                        >

                            <option value="all">
                                Everyone
                            </option>

                            <option value="selected">
                                Selected users
                            </option>

                        </select>

                    </label>


                    {targetAudience ===
                        "selected" && (

                        <div className="announcement-selected-users-note">

                            Selected-user picker
                            will be added next.

                        </div>

                    )}


                    {/* Attachments */}

                    <label>

                        Attachments

                        <input
                            type="file"
                            multiple
                            onChange={
                                handleFileChange
                            }
                            disabled={
                                submitting
                            }
                        />

                    </label>


                    {/* Selected files */}

                    {files.length > 0 && (

                        <div className="announcement-selected-files">

                            {files.map(
                                (file) => (

                                    <div
                                        key={`${file.name}-${file.size}`}
                                    >
                                        📎 {file.name}
                                    </div>

                                )
                            )}

                        </div>

                    )}


                    {/* Actions */}

                    <div className="announcement-form-actions">

                        <button
                            type="button"
                            onClick={onClose}
                            disabled={
                                submitting
                            }
                        >
                            Cancel
                        </button>


                        <button
                            type="submit"
                            disabled={
                                submitting
                            }
                        >
                            {submitting
                                ? "Publishing..."
                                : "Publish"}
                        </button>

                    </div>

                </form>

            </div>

        </div>
    );
}


export default CreateAnnouncementModal;