(function () {
    'use strict';

    function initAuthorCard() {
        var authorCard = document.getElementById('authorCard');
        if (!authorCard) return;

        function setAuthorCardOpen(open) {
            authorCard.classList.toggle('open', open);
            authorCard.setAttribute('aria-expanded', String(open));
            authorCard.setAttribute('aria-label', open ? '收起微信公众号二维码' : '显示微信公众号二维码');
            var expanded = authorCard.querySelector('.author-card-expanded');
            if (expanded) expanded.setAttribute('aria-hidden', String(!open));
        }

        authorCard.addEventListener('click', function () {
            setAuthorCardOpen(!authorCard.classList.contains('open'));
        });

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && authorCard.classList.contains('open')) {
                setAuthorCardOpen(false);
                authorCard.focus();
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAuthorCard);
    } else {
        initAuthorCard();
    }
}());
