$(window).scroll(function () {
    if ($(this).scrollTop()) {
        $('.btn-top').fadeIn();
    } else {
        $('.btn-top').fadeOut();
    }
});
$(function () {
    $(".button-menu").click(function () {
        $('#menu').slideToggle(500);
    });
});

$(window).ready(function () {
    $('.skill-percent').each(function () {
        $(this).animate({
            width: $(this).attr('data-percent')
        }, "easiest");
    })
});

document.addEventListener('DOMContentLoaded', function () {

    var acc = document.getElementsByClassName("accordion");
    for (var i = 0; i < acc.length; i++) {
        acc[i].addEventListener("click", function () {
            this.classList.toggle("active");
            var panel = this.nextElementSibling;
            if (panel.style.maxHeight) {
                panel.style.maxHeight = null;
            } else {
                panel.style.maxHeight = panel.scrollHeight + "px";
            }
        });
    }
});

document.addEventListener('DOMContentLoaded', function () {
    wow = new WOW()
    wow.init()
});
