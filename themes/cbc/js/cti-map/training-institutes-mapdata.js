(function (window) {
  'use strict';

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .trim();
  }

  function resolveValue(value) {
    if (value && typeof value === 'object') {
      if (Object.prototype.hasOwnProperty.call(value, 'value')) {
        return resolveValue(value.value);
      }
      if (Object.prototype.hasOwnProperty.call(value, 'target_id')) {
        if (Object.prototype.hasOwnProperty.call(value, 'title')) {
          return resolveValue(value.title);
        }
        if (Object.prototype.hasOwnProperty.call(value, 'name')) {
          return resolveValue(value.name);
        }
      }
    }
    return value;
  }

  function sanitizeUrl(value) {
    var raw = String(resolveValue(value) || '').trim();
    if (!raw) {
      return '';
    }
    try {
      var parsed = new URL(raw, window.location.origin);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        return parsed.href;
      }
    } catch (e) {
      // Ignore invalid URLs.
    }
    return '';
  }

  function buildDescription(item) {
    var segments = [];
    function add(label, fieldValue) {
      var text = escapeHtml(resolveValue(fieldValue));
      if (text) {
        segments.push('<b>' + label + ':</b> ' + text);
      }
    }
    add('Application No', item.field_application_no);
    add('Institute', item.field_institute || item.title);
    add('Stage', item.field_stage);
    add('State', item.field_state_of_map);
    add('District', item.field_district);
    return segments.join('<br>');
  }

  function mapInstitutesToLocations(items) {
    var locations = {};
    var counter = 0;
    (items || []).forEach(function (rawItem) {
      var normalized = rawItem && rawItem.node ? rawItem.node : rawItem;
      if (!normalized) {
        return;
      }
      var lat = parseFloat(resolveValue(normalized.field_latitude));
      var lng = parseFloat(resolveValue(normalized.field_longitude));
      if (!isFinite(lat) || !isFinite(lng)) {
        return;
      }
      counter += 1;
      var key = String(counter);
      var title = resolveValue(normalized.title) || resolveValue(normalized.field_institute) || 'Training Institute';
      locations[key] = {
        name: escapeHtml(title),
        lat: lat.toString(),
        lng: lng.toString(),
        description: buildDescription(normalized),
        url: sanitizeUrl(normalized.field_website)
      };
    });
    return locations;
  }

  function applyInstituteData(items) {
    baseConfig.locations = mapInstitutesToLocations(items);
    window.simplemaps_countrymap_mapdata = JSON.parse(JSON.stringify(baseConfig));
    return baseConfig.locations;
  }

  var baseConfig = {
    main_settings: {
      //General settings
      width: "responsive",
      background_color: "#FFFFFF",
      background_transparent: "yes",
      border_color: "#ffffff",
      pop_ups: "detect",

      //State defaults
      state_description: "State description",
      state_color: "#0063ae",
      state_hover_color: "#004b88",
      state_url: "",
      border_size: 1.5,
      all_states_inactive: "no",
      all_states_zoomable: "yes",

      //Location defaults
      location_description: "Location description",
      location_url: "",
      location_color: "#ff9800",
      location_opacity: 0.8,
      location_hover_opacity: 1,
      location_size: 25,
      location_type: "circle",
      location_image_source: "location-pin.png",
      location_border_color: "#FFFFFF",
      location_border: 2,
      location_hover_border: 2.5,
      all_locations_inactive: "no",
      all_locations_hidden: "no",

      //Label defaults
      label_color: "#ffffff",
      label_hover_color: "#ffffff",
      label_size: 16,
      label_font: "Arial",
      label_display: "auto",
      label_scale: "yes",
      hide_labels: "no",
      hide_eastern_labels: "no",

      //Zoom settings
      zoom: "yes",
      manual_zoom: "yes",
      back_image: "no",
      initial_back: "no",
      initial_zoom: "0",
      initial_zoom_solo: "no",
      region_opacity: 1,
      region_hover_opacity: 0.6,
      zoom_out_incrementally: "yes",
      zoom_percentage: 0.99,
      zoom_time: 0.5,

      //Popup settings
      popup_color: "white",
      popup_opacity: 0.9,
      popup_shadow: 1,
      popup_corners: 5,
      popup_font: "12px/1.5 Verdana, Arial, Helvetica, sans-serif",
      popup_nocss: "no",

      //Advanced settings
      div: "training-institutes-map",
      auto_load: "no",
      url_new_tab: "yes",
      images_directory: "",
      fade_time: 0.1,
      link_text: "Visit Website"
    },
    state_specific: {
    INAN: {
      name: "Andaman and Nicobar",
      description: "default",
      color: "default",
      hover_color: "default",
      url: "default"
    },
    INAP: {
      name: "Andhra Pradesh",
      description: "default",
      color: "default",
      hover_color: "default",
      url: "default"
    },
    INAR: {
      name: "Arunachal Pradesh",
      description: "default",
      color: "default",
      hover_color: "default",
      url: "default"
    },
    INAS: {
      name: "Assam",
      description: "default",
      color: "default",
      hover_color: "default",
      url: "default"
    },
    INBR: {
      name: "Bihar",
      description: "default",
      color: "default",
      hover_color: "default",
      url: "default"
    },
    INCH: {
      name: "Chandigarh",
      description: "default",
      color: "default",
      hover_color: "default",
      url: "default"
    },
    INCT: {
      name: "Chhattisgarh",
      description: "default",
      color: "default",
      hover_color: "default",
      url: "default"
    },
    INDH: {
      name: "Dādra and Nagar Haveli and Damān and Diu",
      description: "default",
      color: "default",
      hover_color: "default",
      url: "default"
    },
    INDL: {
      name: "Delhi",
      description: "default",
      color: "default",
      hover_color: "default",
      url: "default"
    },
    INGA: {
      name: "Goa",
      description: "default",
      color: "default",
      hover_color: "default",
      url: "default"
    },
    INGJ: {
      name: "Gujarat",
      description: "default",
      color: "default",
      hover_color: "default",
      url: "default"
    },
    INHP: {
      name: "Himachal Pradesh",
      description: "default",
      color: "default",
      hover_color: "default",
      url: "default"
    },
    INHR: {
      name: "Haryana",
      description: "default",
      color: "default",
      hover_color: "default",
      url: "default"
    },
    INJH: {
      name: "Jharkhand",
      description: "default",
      color: "default",
      hover_color: "default",
      url: "default"
    },
    INJK: {
      name: "Jammu and Kashmir",
      description: "default",
      color: "default",
      hover_color: "default",
      url: "default"
    },
    INKA: {
      name: "Karnataka",
      description: "default",
      color: "default",
      hover_color: "default",
      url: "default"
    },
    INKL: {
      name: "Kerala",
      description: "default",
      color: "default",
      hover_color: "default",
      url: "default"
    },
    INLA: {
      name: "Ladakh",
      description: "default",
      color: "default",
      hover_color: "default",
      url: "default"
    },
    INLD: {
      name: "Lakshadweep",
      description: "default",
      color: "default",
      hover_color: "default",
      url: "default"
    },
    INMH: {
      name: "Maharashtra",
      description: "default",
      color: "default",
      hover_color: "default",
      url: "default"
    },
    INML: {
      name: "Meghalaya",
      description: "default",
      color: "default",
      hover_color: "default",
      url: "default"
    },
    INMN: {
      name: "Manipur",
      description: "default",
      color: "default",
      hover_color: "default",
      url: "default"
    },
    INMP: {
      name: "Madhya Pradesh",
      description: "default",
      color: "default",
      hover_color: "default",
      url: "default"
    },
    INMZ: {
      name: "Mizoram",
      description: "default",
      color: "default",
      hover_color: "default",
      url: "default"
    },
    INNL: {
      name: "Nagaland",
      description: "default",
      color: "default",
      hover_color: "default",
      url: "default"
    },
    INOR: {
      name: "Orissa",
      description: "default",
      color: "default",
      hover_color: "default",
      url: "default"
    },
    INPB: {
      name: "Punjab",
      description: "default",
      color: "default",
      hover_color: "default",
      url: "default"
    },
    INPY: {
      name: "Puducherry",
      description: "default",
      color: "default",
      hover_color: "default",
      url: "default"
    },
    INRJ: {
      name: "Rajasthan",
      description: "default",
      color: "default",
      hover_color: "default",
      url: "default"
    },
    INSK: {
      name: "Sikkim",
      description: "default",
      color: "default",
      hover_color: "default",
      url: "default"
    },
    INTG: {
      name: "Telangana",
      description: "default",
      color: "default",
      hover_color: "default",
      url: "default"
    },
    INTN: {
      name: "Tamil Nadu",
      description: "default",
      color: "default",
      hover_color: "default",
      url: "default"
    },
    INTR: {
      name: "Tripura",
      description: "default",
      color: "default",
      hover_color: "default",
      url: "default"
    },
    INUP: {
      name: "Uttar Pradesh",
      description: "default",
      color: "default",
      hover_color: "default",
      url: "default"
    },
    INUT: {
      name: "Uttaranchal",
      description: "default",
      color: "default",
      hover_color: "default",
      url: "default"
    },
    INWB: {
      name: "West Bengal",
      description: "default",
      color: "default",
      hover_color: "default",
      url: "default"
    }
  },
  locations: {},
  labels: {
    INAN: {
      name: "Andaman and Nicobar",
      parent_id: "INAN"
    },
    INAP: {
      name: "Andhra Pradesh",
      parent_id: "INAP"
    },
    INAR: {
      name: "Arunachal Pradesh",
      parent_id: "INAR"
    },
    INAS: {
      name: "Assam",
      parent_id: "INAS"
    },
    INBR: {
      name: "Bihar",
      parent_id: "INBR"
    },
    INCH: {
      name: "Chandigarh",
      parent_id: "INCH"
    },
    INCT: {
      name: "Chhattisgarh",
      parent_id: "INCT"
    },
    INDH: {
      name: "Dādra and Nagar Haveli and Damān and Diu",
      parent_id: "INDH"
    },
    INDL: {
      name: "Delhi",
      parent_id: "INDL"
    },
    INGA: {
      name: "Goa",
      parent_id: "INGA"
    },
    INGJ: {
      name: "Gujarat",
      parent_id: "INGJ"
    },
    INHP: {
      name: "Himachal Pradesh",
      parent_id: "INHP"
    },
    INHR: {
      name: "Haryana",
      parent_id: "INHR"
    },
    INJH: {
      name: "Jharkhand",
      parent_id: "INJH"
    },
    INJK: {
      name: "Jammu and Kashmir",
      parent_id: "INJK"
    },
    INKA: {
      name: "Karnataka",
      parent_id: "INKA"
    },
    INKL: {
      name: "Kerala",
      parent_id: "INKL"
    },
    INLA: {
      name: "Ladakh",
      parent_id: "INLA"
    },
    INLD: {
      name: "Lakshadweep",
      parent_id: "INLD"
    },
    INMH: {
      name: "Maharashtra",
      parent_id: "INMH"
    },
    INML: {
      name: "Meghalaya",
      parent_id: "INML"
    },
    INMN: {
      name: "Manipur",
      parent_id: "INMN"
    },
    INMP: {
      name: "Madhya Pradesh",
      parent_id: "INMP"
    },
    INMZ: {
      name: "Mizoram",
      parent_id: "INMZ"
    },
    INNL: {
      name: "Nagaland",
      parent_id: "INNL"
    },
    INOR: {
      name: "Orissa",
      parent_id: "INOR"
    },
    INPB: {
      name: "Punjab",
      parent_id: "INPB"
    },
    INPY: {
      name: "Puducherry",
      parent_id: "INPY"
    },
    INRJ: {
      name: "Rajasthan",
      parent_id: "INRJ"
    },
    INSK: {
      name: "Sikkim",
      parent_id: "INSK"
    },
    INTG: {
      name: "Telangana",
      parent_id: "INTG"
    },
    INTN: {
      name: "Tamil Nadu",
      parent_id: "INTN"
    },
    INTR: {
      name: "Tripura",
      parent_id: "INTR"
    },
    INUP: {
      name: "Uttar Pradesh",
      parent_id: "INUP"
    },
    INUT: {
      name: "Uttaranchal",
      parent_id: "INUT"
    },
    INWB: {
      name: "West Bengal",
      parent_id: "INWB"
    }
  }
};

(function (win) {
  'use strict';

  var Drupal = win.Drupal || {};
  var drupalSettings = win.drupalSettings || {};
  var hasFetch = typeof win.fetch === 'function';
  var hasPromise = typeof win.Promise === 'function';

  function sanitize(value) {
    if (value === undefined || value === null) {
      return '';
    }
    return String(value).replace(/\s+/g, ' ').trim();
  }

  function safeField(value) {
    var text = sanitize(value);
    return text || 'N/A';
  }

  function extractUrl(html) {
    var raw = sanitize(html);
    if (!raw) {
      return '';
    }

    var match = raw.match(/href="([^"]+)"/i);
    if (match && match[1]) {
      return match[1];
    }
    return raw;
  }

  function buildDescription(entry) {
    var instituteName = sanitize(entry.field_institute) || sanitize(entry.title);
    return [
      '<b>Application No:</b> ' + safeField(entry.field_application_no),
      '<b>Institute:</b> ' + safeField(instituteName),
      '<b>Stage:</b> ' + safeField(entry.field_stage),
      '<b>State:</b> ' + safeField(entry.field_state_of_map),
      '<b>District:</b> ' + safeField(entry.field_district)
    ].join('<br>');
  }

  function formatLocations(data) {
    var locations = {};
    data.forEach(function (item, index) {
      if (!item) {
        return;
      }
      var lat = sanitize(item.field_latitude);
      var lng = sanitize(item.field_longitude);
      if (!lat || !lng) {
        return;
      }

      locations[String(index + 1)] = {
        name: sanitize(item.title) || 'Training Institute',
        lat: lat,
        lng: lng,
        description: buildDescription(item),
        url: extractUrl(item.field_website)
      };
    });
    return locations;
  }

  function getApiUrl() {
    if (Drupal && typeof Drupal.url === 'function') {
      return Drupal.url('training-institute');
    }
    var baseUrl = (drupalSettings.path && drupalSettings.path.baseUrl) || '/';
    if (baseUrl.charAt(baseUrl.length - 1) === '/') {
      baseUrl = baseUrl.slice(0, -1);
    }
    return baseUrl + '/training-institute';
  }

  function hydrateLocations() {
    if (!hasFetch || !hasPromise) {
      console.warn('CBC training map: fetch API unavailable, map will remain empty.');
      return null;
    }

    return win.fetch(getApiUrl(), {
      headers: {
        'Accept': 'application/json'
      },
      credentials: 'same-origin'
    })
      .then(function (response) {
        if (!response.ok) {
          throw new Error('Request failed with status ' + response.status);
        }
        return response.json();
      })
      .then(function (data) {
        if (!Array.isArray(data)) {
          return {};
        }
        return formatLocations(data);
      })
      .then(function (locations) {
        simplemaps_countrymap_mapdata.locations = locations;
        if (win.simplemaps_countrymap && typeof win.simplemaps_countrymap.load === 'function') {
          win.simplemaps_countrymap.load();
        }
        return locations;
      })
      .catch(function (error) {
        console.error('CBC training map: unable to fetch training institute locations.', error);
        return {};
      });
  }

  var hydrationPromise = hydrateLocations();
  if (hydrationPromise && typeof hydrationPromise.then === 'function') {
    win.trainingInstitutesMapDataPromise = hydrationPromise;
  } else {
    win.trainingInstitutesMapDataPromise = null;
  }
})(window);

  window.CBCTrainingMapBaseConfig = baseConfig;
  window.CBCTrainingMapApplyData = applyInstituteData;

  // Provide the legacy global expected by SimpleMaps on load.
  window.simplemaps_countrymap_mapdata = JSON.parse(JSON.stringify(baseConfig));
})(window);