$.fn.animateRotate = function(angle, duration, easing, complete) {
  var args = $.speed(duration, easing, complete);
  var step = args.step;
  return this.each(function(i, e) {
    args.complete = $.proxy(args.complete, e);
    args.step = function(now) {
      $.style(e, 'transform', 'rotate(' + now + 'deg)');
      if (step) return step.apply(e, arguments);
    };

    $({deg: 0}).animate({deg: angle}, args);
  });
};


(function() {
  var countInterview = undefined;
  var triActuel = "desc";

  var app = angular.module('TechInChartres', []);
  app.filter('unsafe', function($sce) { return $sce.trustAsHtml; });

  app.controller('mainController', function($scope, $http, interviewsFactory) {

    // Ici on récupère nos données avec notre service, et on formate les données
    $scope.data = interviewsFactory.get().then((data) => {

      countInterview = data.interviews.length; // Ici on attribut le nombre d'interview a cette variable

      // ici on parse les Questions, en se servant de la balise [Q]
      for(var interview in data.interviews) {
        var questionsReponses = data.interviews[interview].content;
        questionsReponses = questionsReponses.replace( /\[Q\](.+?)\[\/Q]/gi, "<h1 class='interviewQuestion'>$1</h1>" );
        data.interviews[interview].content = questionsReponses;
      }
      // Sort DESC
      data.interviews.sort(function(a, b) {
        return parseFloat(b.date) - parseFloat(a.date);
      });

      $scope.data = data;
    });




    $scope.aucunResultat = false;



    $scope.triData = function() {
      // On permet d'activer le tri uniquement si on a pas de recherche en cours
      if($('#search_value').val().length == 0) {
        // Si on est en tri Desc, on passe en ASC
        if(triActuel == 'desc') {
          triActuel = 'asc';
          $scope.data.interviews.sort(function(a, b) {
            return parseFloat(a.date) - parseFloat(b.date);
          });
        }
        else {
          // Sinon on passe en tri DESC
          triActuel = 'desc';
          $scope.data.interviews.sort(function(a, b) {
            return parseFloat(b.date) - parseFloat(a.date);
          });
        }
      }
    };

    // Moteur de recherche qui prend la valeur du champ de
    // recherche et qui affiche les interviews correspondants
    $scope.searchEngine = function(index) {

      var searchValue = $('#search_value').val();
      var interviewName = $scope.data.interviews[index].title;

      if(searchValue.length > 0) {
        // On "désactive" la fonction tri
        $('#sortBloc').css('opacity', '.5');

        var pattern = new RegExp(searchValue, "gi");
        if(pattern.test(interviewName))
          return true;
        else
          return false;
      }
      else {
        $('#sortBloc').css('opacity', '1'); // On réactive le tri
        return true;
      }

    };

  });
  app.factory('countDownService', function($http, $q) {
    return {
      error: null,
      nextMeetupDate: null,
      get() {
        let deferred = $q.defer();
        if(!this.nextMeetupDate) {
          // https://api.meetup.com/2/events?key=65224b6434776b43c3746545c315361&group_urlname=techn-in-chartres&sign=true
          $http.get("js/countdownExample.json").then((res) => {
            this.nextMeetupDate = res.data;
            deferred.resolve(this.nextMeetupDate);
          }, (error) => {
            deferred.error = error;
          });
        }
        else {
          deferred.resolve(this.nextMeetupDate);
        }
        return deferred.promise;
      }
    }
  });
  app.directive('footerCss', function () {return {restrict: 'EA',templateUrl: 'css/footer.css'};});

  app.directive('navbar', ['countDownService', function(countDownService) {
    return {
      restrict: 'EA',
      templateUrl: 'templates/pages/navbar.html',
      link: function (scope, element, attrs) {
        angular.getTestability(element).whenStable(function() {
          // On utilise le service qui va chercher la date du prochain meetup
          countDownService.get().then((data) => {
            var nextMeetupDate = data.results[0].time;
            // Ici on passe deux DIV avec l'ID "countDown" et l'ID "countDown_navbar" a la fonction "countdown"
          	// Ici on utilise un Plugin jQuery, le plugin "countdown".
          	// On défini la date du compte à rebours dans la fonction countdown (La date viendra de l'API Meetup)
            $('#countDown_navbar').countdown({
                date: nextMeetupDate
            });
          });

          var forEach=function(t,o,r){if("[object Object]"===Object.prototype.toString.call(t))for(var c in t)Object.prototype.hasOwnProperty.call(t,c)&&o.call(r,t[c],c,t);else for(var e=0,l=t.length;l>e;e++)o.call(r,t[e],e,t)};

    	    var hamburgers = document.querySelectorAll(".hamburger");
    	    if (hamburgers.length > 0) {
    	      forEach(hamburgers, function(hamburger) {
    	        hamburger.addEventListener("click", function() {
    	          this.classList.toggle("is-active");
    	        }, false);
    	      });
    	    }

          // Click sur menu hbgr
          $('.hamburger').click(function() {

            if($(this).hasClass('is-active')) {

              $('#hamburgerMain').css('display', 'block').animate({
                'opacity': '1'
              }, 300, function() {
                var timeOutAnimation = 200;

                $('.hamburgerItem').each(function() {

                  var $item = $(this);
                  setTimeout(function() {
                    $item.animate({
                      'margin-top': '0px'
                    }, 400);
                  }, timeOutAnimation);
                  timeOutAnimation+=200;

                });

              });

            }
            else {
              // Cache menu
              $('#hamburgerMain').animate({
                'opacity': '0'
              }, 500, function() {
                $(this).css('display', 'none');
                $('.hamburgerItem').css('margin-top', '1000px');
              });

            }
          });

        });
      }
    };
  }]);

  app.directive('footer', function () {
    return {
      restrict: 'E',
      templateUrl: 'templates/pages/footer.html'
    }
  });

  $(document).ready(function() {
    $('#search_value').on('input', function() {
      // Ici on regarde si le nombre de bloc caché (bloc qui ne correspondent pas a la recherche)
      // est le même que le nombre total de bloc. SI oui, alors c'est qu'on a aucun résultat
      // Donc on montre le bloc qui le dit
      if(countInterview === $('div.ng-hide').length) {
        $('.noresult').removeClass('hideBloc');
      }
      else {
        $('.noresult').addClass('hideBloc');
      }
    });

  });
  // On écoute le moindre click. On ne peut utiliser la fonctionc click puisque les éléments
  // ne sont pas encore présents
  $(document).on("click", ".arrow", function(){
    const durationAnimation = 200;

    var $currentInterview = $(this).parent().parent().parent().parent().parent().parent().parent().parent();
    var $currentArrow = $(this);

    if($('.arrowActive').length > 0) {
      // Si on clique sur l'élément qui est ouvert
      if($(this).hasClass('arrowActive')) {
        $(this).removeClass('arrowActive').animateRotate(0, {
          duration: durationAnimation,
          easing: 'linear',
          complete: function() {
            $currentInterview.css('height', '250px');
          },
          step: function() {}
        });
      }
      else {
        $('.arrow').removeClass('arrowActive').animateRotate(0, {
          duration: durationAnimation,
          easing: 'linear',
          complete: function() {

            $currentArrow.addClass('arrowActive').animateRotate(180, {
              duration: durationAnimation,
              easing: 'linear',
              complete: function () {
                $('.interview').css('height', '250px');
                $currentInterview.css('height', 'inherit');
              },
              step: function () {}
            });

          },
          step: function() {}
        });
      }
    }
    else {
      // Tout est fermé

      $(this).addClass('arrowActive').animateRotate(180, {
        duration: durationAnimation,
        easing: 'linear',
        complete: function () {
          $currentInterview.css('height', 'inherit');
        },
        step: function () {}
      });
    }
  })
  .on("click", "#sortBloc", function(){
    // L'animation ne fonctionne que si on a pas effectué une recherche
    if($('#search_value').val().length == 0) {
      if($(this).hasClass('desc')) {
        $(this).attr('class', 'asc').children('img').css({
          'transform': 'rotate(180deg)'
        });
        $(this).children('font').text('Les moins récents');
      }
      else {
        $(this).attr('class', 'desc').children('img').css({
          'transform': 'rotate(0deg)'
        });
        $(this).children('font').text('Les plus récents');
      }
    }
  });

  // Get All interviews
  app.factory('interviewsFactory', function($http, $q) {
    return {
      error: null,
      interviews: null,
      get() {
        let deferred = $q.defer();
        if(!this.interviews) {
          $http.get("js/interviewExample.json").then((res) => {
            this.interviews = res.data;
            deferred.resolve(this.interviews);
          }, (error) => {
            deferred.error = error;
          });
        }
        else {
          deferred.resolve(this.interviews);
        }
        return deferred.promise;
      }
    }
  });


})();
