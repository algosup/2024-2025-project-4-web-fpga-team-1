document.addEventListener("DOMContentLoaded", function () {
    const points = document.querySelectorAll(".point");
    const infoBoxLeft = document.getElementById("infoBoxleft");
    const infoBoxRight = document.getElementById("infoBoxright");

    function showInfoBox(box, info) {
        box.textContent = info;
        box.style.display = "block";
        box.style.opacity = "0";
        box.style.transition = "opacity 0.3s ease-in-out";
        setTimeout(() => { box.style.opacity = "1"; }, 10);
    }

    function hideInfoBoxes(event) {
        if (!event.relatedTarget || (!infoBoxLeft.contains(event.relatedTarget) && !infoBoxRight.contains(event.relatedTarget))) {
            infoBoxLeft.style.opacity = "0";
            infoBoxRight.style.opacity = "0";
            setTimeout(() => {
                infoBoxLeft.style.display = "none";
                infoBoxRight.style.display = "none";
            }, 500);
        }
    }

    points.forEach(point => {
        point.addEventListener("mouseenter", function () {
            const info = this.getAttribute("data-info");
            const rect = this.getBoundingClientRect();
            const pointLeft = rect.left + window.scrollX;
            const screenWidth = window.innerWidth;
            
            if (pointLeft < screenWidth / 2 -10) {
                showInfoBox(infoBoxLeft, info);
            } else {
                showInfoBox(infoBoxRight, info);
            }
        });

        point.addEventListener("mouseleave", hideInfoBoxes);
    });
});