(function ($) {
    "use strict";

    // Spinner
    // Spinner (chargement)
    var spinner = function () {
        setTimeout(function () {
            if ($('#spinner').length > 0) {
                $('#spinner').removeClass('show');
            }
        }, 1);
    };
    spinner();


    // Initialiser wowjs
    new WOW().init();


    // Navbar fixe
    $(window).scroll(function () {
        if ($(window).width() > 992) {
            if ($(this).scrollTop() > 45) {
                $('.sticky-top .container').addClass('shadow-sm').css('max-width', '100%');
            } else {
                $('.sticky-top .container').removeClass('shadow-sm').css('max-width', $('.topbar .container').width());
            }
        } else {
            $('.sticky-top .container').addClass('shadow-sm').css('max-width', '100%');
        }
    });


    // Carrousel de l'en-tête (Hero Header)
    $(".header-carousel").owlCarousel({
        items: 1,
        autoplay: true,
        smartSpeed: 2000,
        center: false,
        dots: false,
        loop: true,
        margin: 0,
        nav: true,
        navText: [
            '<i class="bi bi-arrow-left"></i>',
            '<i class="bi bi-arrow-right"></i>'
        ]
    });



    // Carrousel des projets
    $(".project-carousel").owlCarousel({
        autoplay: true,
        smartSpeed: 1000,
        center: false,
        dots: true,
        loop: true,
        margin: 25,
        nav: false,
        navText: [
            '<i class="bi bi-arrow-left"></i>',
            '<i class="bi bi-arrow-right"></i>'
        ],
        responsiveClass: true,
        responsive: {
            0: {
                items: 1
            },
            576: {
                items: 1
            },
            768: {
                items: 2
            },
            992: {
                items: 2
            },
            1200: {
                items: 2
            }
        }
    });

    // Carrousel des témoignages
    $(".testimonial-carousel").owlCarousel({
        autoplay: true,
        smartSpeed: 1500,
        center: false,
        dots: true,
        loop: true,
        margin: 25,
        nav: false,
        navText: [
            '<i class="bi bi-arrow-left"></i>',
            '<i class="bi bi-arrow-right"></i>'
        ],
        responsiveClass: true,
        responsive: {
            0: {
                items: 1
            },
            576: {
                items: 1
            },
            768: {
                items: 2
            },
            992: {
                items: 2
            },
            1200: {
                items: 2
            }
        }
    });


    // Compteur des faits
    $('[data-toggle="counter-up"]').counterUp({
        delay: 5,
        time: 2000
    });



    // Bouton retour en haut
    $(window).scroll(function () {
        if ($(this).scrollTop() > 300) {
            $('.back-to-top').fadeIn('slow');
        } else {
            $('.back-to-top').fadeOut('slow');
        }
    });
    $('.back-to-top').click(function () {
        $('html, body').animate({ scrollTop: 0 }, 1500, 'easeInOutExpo');
        return false;
    });

    document.addEventListener('DOMContentLoaded', () => {
        const navLinks = document.querySelectorAll('.nav-item.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navLinks.forEach(nav => {
                    nav.classList.remove('active');
                });
                link.classList.add('active');
            });
        });
    });


    function translatePage(lang) {
        const url = new URL(window.location.href);
        const base = url.origin + url.pathname;
        window.location.href = `https://translate.google.com/translate?hl=${lang}&sl=auto&tl=${lang}&u=${base}`;
    }



    // Configuration du carousel pour les blogs
    $(".blog-carousel").owlCarousel({
        autoplay: true,
        smartSpeed: 1000,
        margin: 25,
        loop: true,
        center: false,
        dots: true,
        navText: [
            '<i class="bi bi-arrow-left"></i>',
            '<i class="bi bi-arrow-right"></i>'
        ],
        rtl: true, // Direction de droite à gauche
        autoplayTimeout: 5000, // Temps de défilement de 5 secondes
        responsive: {
            0: {
                items: 1
            },
            768: {
                items: 2
            },
            992: {
                items: 3
            }
        }
    });

    // Configuration du carousel pour les blogs (code existant)
    $(".blog-carousel").owlCarousel({
        autoplay: true,
        smartSpeed: 1000,
        margin: 25,
        loop: true,
        center: false,
        dots: true,
        navText: [
            '<i class="bi bi-arrow-left"></i>',
            '<i class="bi bi-arrow-right"></i>'
        ],
        rtl: true, // Direction de droite à gauche
        autoplayTimeout: 5000, // Temps de défilement de 5 secondes
        responsive: {
            0: {
                items: 1
            },
            768: {
                items: 2
            },
            992: {
                items: 3
            }
        }
    });

    // Fonction pour afficher le blog sélectionné et masquer les autres
    function showBlogDetail(blogId) {
        // Masquer tous les blogs détaillés
        $('.blog-detail-content').hide();

        // Afficher le blog sélectionné
        $('#blog-' + blogId + '-detail').show();

        // Faire défiler jusqu'à la section détail
        $('html, body').animate({
            scrollTop: $('.blog-detail').offset().top - 100
        }, 1000);
    }

    // Au chargement de la page, afficher le blog 1 par défaut
    $(document).ready(function () {
        showBlogDetail(1);

        // Gestion des clics sur les boutons "Lire plus"
        $('.blog-item .btn').click(function (e) {
            e.preventDefault();

            // Déterminer quel blog a été cliqué
            const blogItem = $(this).closest('.blog-item');
            const blogIndex = $('.owl-item:not(.cloned) .blog-item').index(blogItem) + 1;

            // Si on ne peut pas déterminer l'index (par exemple dans les items clonés du carousel)
            // on utilise une méthode alternative basée sur le contenu
            let blogId;
            if (blogIndex <= 0) {
                const blogTitle = blogItem.find('.h4').text().trim();

                // Vérifier le titre pour déterminer de quel blog il s'agit
                if (blogTitle.includes('plan de retrait')) {
                    blogId = 1;
                } else if (blogTitle.includes('Prêt Santé')) {
                    blogId = 2;
                } else if (blogTitle.includes('Besoin de financer vos vacances')) {
                    blogId = 3;
                } else if (blogTitle.includes('cryptomonnaies')) {
                    blogId = 4;
                } else if (blogTitle.includes('Finance verte')) {
                    blogId = 5;
                } else if (blogTitle.includes('Intelligence artificielle')) {
                    blogId = 6;
                } else {
                    blogId = 1; // Par défaut
                }
            } else {
                blogId = blogIndex;
            }

            showBlogDetail(blogId);
        });
    });



    
    // Initialisation du carrousel des partenaires secondaires
    $(document).ready(function () {
        $(".partner-carousel").owlCarousel({
            loop: true,
            margin: 10,
            nav: true, // Active les boutons "prev" et "next"
            dots: false, // Désactive les points de navigation si non nécessaires
            autoplay: true,
            autoplayTimeout: 3000,
            responsive: {
                0: {
                    items: 2
                },
                768: {
                    items: 4
                },
                1200: {
                    items: 6
                }
            },
            navText: [
                '<i class="fas fa-chevron-left"></i>', // Icône pour le bouton "prev"
                '<i class="fas fa-chevron-right"></i>' // Icône pour le bouton "next"
            ]
        });
    });

})(jQuery);