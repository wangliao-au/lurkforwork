
import { apiCall } from "./helpers.js";

export const populateItems = async (data, containerId) => {
    document.getElementById(containerId).textContent = "";
    for (const item of data) {
        const feedDom = document.createElement("div");
        feedDom.className = "card mb-3 feed-card";

        const row = document.createElement("div");
        row.className = "row no-gutters";
        feedDom.appendChild(row);

        const colImg = document.createElement("div");
        colImg.className = "col-md-4";
        row.appendChild(colImg);

        const imgWrapper = document.createElement("div");
        imgWrapper.className = "card-img img-wrapper";
        colImg.appendChild(imgWrapper);
        const img = document.createElement("img");
        img.src = item.image;
        img.className = "job-image";
        imgWrapper.appendChild(img);

        const colBody = document.createElement("div");
        colBody.className = "col-md-8";
        row.appendChild(colBody);

        const cardBody = document.createElement("div");
        cardBody.className = "card-body";
        colBody.appendChild(cardBody);

        const title = document.createElement("h5");
        title.className = "card-title";
        title.textContent = item.title;
        cardBody.appendChild(title);

        const description = document.createElement("p");
        description.className = "card-text";
        description.textContent = item.description;
        cardBody.appendChild(description);

        // creator, post time and starting date
        const extraInfo = document.createElement("div");
        extraInfo.className = "creator-time-wrapper";
        cardBody.appendChild(extraInfo);
        const creatorText = createInfoTextElement("Created by: " + await getCreatorUsername(item.creatorId), "card-text text-muted");
        extraInfo.appendChild(creatorText);
        const createTimeText = createInfoTextElement("Posted at: " + formatTime(item.createdAt), "card-text text-muted");
        extraInfo.appendChild(createTimeText);
        const startingDateText = createInfoTextElement("Starting date: " + formatTime(item.start), "card-text text-muted");
        extraInfo.appendChild(startingDateText);

        if (containerId === "feed-items") {
            // like and comment buttons
            const actionsRow = document.createElement("div");
            actionsRow.className = "d-flex justify-content-start align-items-center mt-2 actions-row";
            cardBody.appendChild(actionsRow);

            // like button, badge and event listener
            const likeButton = document.createElement("button");
            likeButton.className = "btn btn-outline-primary btn-sm me-2 like-button";
            actionsRow.appendChild(likeButton);
            const likeIcon = document.createElement("i"); // font awesome icon
            likeIcon.className = "fas fa-thumbs-up";
            likeButton.appendChild(likeIcon);
            const likeText = document.createTextNode(" Likes ");
            likeButton.appendChild(likeText);
            const likeBadge = document.createElement("span");
            likeBadge.className = "badge bg-danger like-badge";
            likeBadge.textContent = item.likes.length;
            likeButton.appendChild(likeBadge);
            likeBadge.addEventListener("click", (event) => {
                event.stopPropagation(); // Prevent button click event from being triggered
                // pop up people who liked this post box
                const likedBy = item.likes.map(user => user.userName)
                popupLikeList(likedBy);
            });
            const currentUserId = localStorage.getItem("userId");
            const userHasLiked = item.likes.find(user => user.userId == currentUserId);
            toggleLikeButton(likeButton, userHasLiked);
            likeButton.addEventListener('click', () => {
                const liked = item.likes.find(user => user.userId == currentUserId);
                console.log(liked);
                if (liked) {
                    apiCall(`job/like`, "PUT", { "id": item.id, "turnon": false });
                } else {
                    apiCall(`job/like`, "PUT", { "id": item.id, "turnon": true });
                }
                likeBadge.textContent = item.likes.length;
                const userLiked = item.likes.find(user => user.userId == currentUserId);
                toggleLikeButton(likeButton, userLiked);
            });

            // comment button, badge and event listener
            const commentButton = document.createElement("button");
            commentButton.className = "btn btn-outline-secondary btn-sm comment-button";
            actionsRow.appendChild(commentButton);
            const commentIcon = document.createElement("i");
            commentIcon.className = "fas fa-comment";
            commentButton.appendChild(commentIcon);
            const commentText = document.createTextNode(" Comments ");
            commentButton.appendChild(commentText);
            const commentBadge = document.createElement("span");
            commentBadge.className = "badge bg-secondary";
            commentBadge.textContent = item.comments.length;
            commentButton.appendChild(commentBadge);
            commentButton.addEventListener("click", (event) => {
                // clear comment input
                document.getElementById("comment-input").value = "";
                // pop up comments box
                popupCommentList(item.comments, item.id);
            });
        }

        document.getElementById(containerId).appendChild(feedDom);
    }
};

export const populateFeed = async () => {
    const data = await apiCall("job/feed?start=0", "GET", {});
    const containerId = "feed-items";
    populateItems(data, containerId);
};


const getCreatorUsername = async (id) => {
    const data = await apiCall(`user`, "GET", { userId: id });
    return data.name;
};

const formatTime = (createAt) => {
    const now = new Date();
    const createdDate = new Date(createAt);
    const diffInMs = now - createdDate;
    const diffInMinutes = diffInMs / (1000 * 60);
    const diffInHours = diffInMs / (1000 * 60 * 60);

    if (diffInHours < 24) {
        const hours = Math.floor(diffInHours);
        const minutes = Math.floor(diffInMinutes % 60);
        return `${hours} hours ${minutes} minutes ago`;
    } else {
        const day = createdDate.getDate();
        const month = createdDate.getMonth() + 1;
        const year = createdDate.getFullYear();
        return `${day}/${month}/${year}`;
    }
};

const createInfoTextElement = (text, className) => {
    const paragraph = document.createElement("p");
    paragraph.className = className;
    paragraph.textContent = text;
    return paragraph;
};

const toggleLikeButton = (button, liked) => {
    if (liked) {
        button.classList.remove('btn-outline-primary');
        button.classList.add('btn-primary');
    } else {
        button.classList.remove('btn-primary');
        button.classList.add('btn-outline-primary');
    }
};

const showPopup = (id) => {
    document.getElementById(id).style.display = "block";
};


const popupLikeList = (likedBy) => {
    const likeList = document.getElementById("like-list");
    likeList.innerHTML = '';

    likedBy.forEach(name => {
        const listItem = document.createElement("li");
        listItem.className = "list-group-item";
        listItem.textContent = name;
        likeList.appendChild(listItem);
    });

    showPopup("like-list-popup");
};

document.getElementById("like-close-btn").addEventListener("click", () => {
    document.getElementById("like-list-popup").style.display = "none";
});

const popupCommentList = async (comments, postId) => {
    const commentList = document.getElementById("comment-list");

    comments.forEach(comment => {
        const listItem = document.createElement("li");
        listItem.className = "list-group-item";
        listItem.textContent = comment.userName + ': ' + comment.comment;
        commentList.appendChild(listItem);
    });

    document.getElementById("comment-button").addEventListener("click", () => {
        const comment = document.getElementById("comment-input").value;
        if (comment) {
            apiCall(`job/comment`, "POST", { "id": postId, "comment": comment });
            document.getElementById("comment-input").value = "";
        }
    });

    // User can press enter to submit comment
    const commentInput = document.getElementById("comment-input");
    commentInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault(); // Prevent the default action (newline)
            document.getElementById("comment-button").click();
        }
    });

    showPopup("comment-list-popup");
};

document.getElementById("comment-close-btn").addEventListener("click", () => {
    document.getElementById("comment-list-popup").style.display = "none";
});
