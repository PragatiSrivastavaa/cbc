(function (Drupal, once) {
  'use strict';

  var PIN_POINT_FACTOR = 0.3;
  var MAX_ATTEMPTS = 20;
  var ATTEMPT_DELAY = 300;

  function isTargetLocationElement(element, allowedClasses) {
    if (!allowedClasses || !allowedClasses.length) {
      return true;
    }
    var className = element.getAttribute('class') || '';
    return allowedClasses.some(function (cls) {
      return className.indexOf(cls) !== -1;
    });
  }

  function replaceMarkersWithPins(svg, allowedClasses) {
    var locationElements = svg.querySelectorAll('.sm_location');
    if (!locationElements.length) {
      return;
    }

    Array.prototype.forEach.call(locationElements, function (el) {
      if (!el || el.getAttribute('data-replaced') === 'true') {
        return;
      }

      var tagName = (el.tagName || '').toLowerCase();
      if ((tagName !== 'rect' && tagName !== 'circle') || !isTargetLocationElement(el, allowedClasses)) {
        return;
      }

      try {
        var transform = el.getAttribute('transform') || '';
        var opacity = el.getAttribute('opacity') || '0.8';
        var fill = el.getAttribute('fill') || '#ff9800';
        var stroke = el.getAttribute('stroke') || '#ffffff';
        var strokeWidth = parseFloat(el.getAttribute('stroke-width')) || 2.5;
        var className = el.getAttribute('class') || '';
        var style = el.getAttribute('style') || '';
        var centerX;
        var centerY;
        var baseSize;

        if (tagName === 'circle') {
          var r = parseFloat(el.getAttribute('r')) || 12.5;
          centerX = parseFloat(el.getAttribute('cx')) || 0;
          centerY = parseFloat(el.getAttribute('cy')) || 0;
          baseSize = r * 2;
        } else {
          var x = parseFloat(el.getAttribute('x')) || 0;
          var y = parseFloat(el.getAttribute('y')) || 0;
          var width = parseFloat(el.getAttribute('width')) || 25;
          var height = parseFloat(el.getAttribute('height')) || 25;
          centerX = x + width / 2;
          centerY = y + height / 2;
          baseSize = Math.max(width, height);
        }

        var circleRadius = baseSize * 0.5;
        var topY = centerY - circleRadius;
        var pointExtra = circleRadius * PIN_POINT_FACTOR;
        var bottomY = centerY + circleRadius + pointExtra;
        var sideOffset = circleRadius * (0.25 + 0.15 * PIN_POINT_FACTOR);
        var midOffsetY = circleRadius * (0.15 + 0.1 * PIN_POINT_FACTOR);

        var pinPath = [
          'M ', centerX, ',', topY,
          ' A ', circleRadius, ',', circleRadius, ' 0 1,1 ', (centerX + 0.01), ',', topY,
          ' L ', (centerX + sideOffset), ',', (centerY + midOffsetY),
          ' Q ', (centerX + sideOffset * 0.5), ',', bottomY, ' ', centerX, ',', bottomY,
          ' Q ', (centerX - sideOffset * 0.5), ',', bottomY, ' ', (centerX - sideOffset), ',', (centerY + midOffsetY),
          ' Z'
        ].join('');

        var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pinPath);
        path.setAttribute('fill', fill);
        path.setAttribute('stroke', stroke);
        path.setAttribute('stroke-width', strokeWidth);
        path.setAttribute('opacity', opacity);
        path.setAttribute('class', className + ' sm_pin_marker');
        if (style) {
          path.setAttribute('style', style);
        }
        if (transform) {
          path.setAttribute('transform', transform);
        }
        path.setAttribute('data-replaced', 'true');

        var parent = el.parentNode;
        if (parent) {
          el.setAttribute('data-replaced', 'true');
          parent.replaceChild(path, el);
        }
      } catch (error) {
        console.warn('CBC training map: unable to replace marker', error);
      }
    });
  }

  function waitForSVG(container, callback) {
    var attempts = 0;

    function tryInit() {
      attempts += 1;
      var svg = container.querySelector('svg');
      if (svg) {
        callback(svg);
        return;
      }
      if (attempts < MAX_ATTEMPTS) {
        setTimeout(tryInit, ATTEMPT_DELAY);
      }
    }

    tryInit();
  }

  function removeWatermark(container) {
    var watermark = container.querySelector('a[href*="simplemaps.com"]');
    if (watermark && watermark.parentNode) {
      watermark.parentNode.removeChild(watermark);
    }
  }

  function observeMarkerMutations(container, allowedClasses) {
    if (!window.MutationObserver) {
      return;
    }
    var observer = new MutationObserver(function () {
      var svg = container.querySelector('svg');
      if (svg) {
        replaceMarkersWithPins(svg, allowedClasses);
      }
      removeWatermark(container);
    });
    observer.observe(container, { childList: true, subtree: true });
  }

  function initializeMap(container) {
    if (container.hasAttribute('data-simplemaps-initialized')) return;

    if (typeof simplemaps_countrymap === 'undefined' ||
      typeof simplemaps_countrymap_mapdata === 'undefined' ||
      typeof simplemaps_countrymap_mapinfo === 'undefined') {
      // If scripts aren't loaded yet, retry shortly
      setTimeout(function () { initializeMap(container); }, 100);
      return;
    }

    container.setAttribute('data-simplemaps-initialized', 'true');

    simplemaps_countrymap.mapinfo = simplemaps_countrymap_mapinfo;
    simplemaps_countrymap.create();

    var allowedClasses = [];
    waitForSVG(container, function (svg) {
      replaceMarkersWithPins(svg, allowedClasses);
      removeWatermark(container);
      // Force repaint to fix any render lag
      svg.style.display = 'none';
      svg.offsetHeight; // trigger reflow
      svg.style.display = 'block';
    });
    observeMarkerMutations(container, allowedClasses);
  }

  // Fast Init on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      var container = document.getElementById('training-institutes-map');
      if (container) initializeMap(container);
    });
  } else {
    var container = document.getElementById('training-institutes-map');
    if (container) initializeMap(container);
  }

  Drupal.behaviors.trainingInstitutesMap = {
    attach: function (context) {
      var containers = once('cbc-training-map', '#training-institutes-map', context);
      containers.forEach(function (container) {
        initializeMap(container);
      });
    }
  };
})(Drupal, once);

