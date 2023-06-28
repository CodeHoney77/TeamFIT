(function () {
    console.log("Starting js...")
    sideBarController();
})();

function sideBarController() {
    var btn = document.getElementById("sidebar-button");
    var main_sidebar = document.querySelector("#main_sidebar");

    if (btn) {
        btn.onclick = function (event) {
            if (main_sidebar.classList.contains("sidebar-open")) {
                main_sidebar.classList.remove("sidebar-open");
            } else {
                main_sidebar.classList.add("sidebar-open");
            }
        }
    }

    if (main_sidebar) {
        main_sidebar.onclick = function (event) {
            console.log(event.srcElement)
            var el = event.srcElement;
            if (el.id != "main_sidebar") return;
            console.log("removebg")
            main_sidebar.classList.remove("sidebar-open")
        }
    }

}