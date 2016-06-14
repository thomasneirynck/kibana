export const iconChoices = [
  //Patterns are used to help default icon choices for common field names
  {
    class: 'fa-folder-open-o',
    code: '\uf115',
    'patterns': [/category/i, /folder/i, /group/i]
  }, {
    class: 'fa-cube',
    code: '\uf1b2',
    'patterns': [/prod/i, /sku/i]
  }, {
    class: 'fa-key',
    code: '\uf084',
    'patterns': [/key/i]
  }, {
    class: 'fa-bank',
    code: '\uf19c',
    'patterns': [/bank/i, /account/i]
  }, {
    class: 'fa-automobile',
    code: '\uf1b9',
    'patterns': [/car/i, /veh/i]
  }, {
    class: 'fa-home',
    code: '\uf015',
    'patterns': [/address/i, /home/i]
  }, {
    class: 'fa-question',
    code: '\uf128',
    'patterns': [/query/i, /search/i]
  }, {
    class: 'fa-plane',
    code: '\uf072',
    'patterns': [/flight/i, /plane/i]
  }, {
    class: 'fa-file-o',
    code: '\uf016',
    'patterns': [/file/i, /doc/i]
  }, {
    class: 'fa-user',
    code: '\uf007',
    'patterns': [/user/i, /person/i, /people/i, /owner/i, /cust/i, /participant/i, /party/i, /member/i]
  }, {
    class: 'fa-users',
    code: '\uf0c0',
    'patterns': [/group/i, /team/i, /meeting/i]
  }, {
    class: 'fa-music',
    code: '\uf001',
    'patterns': [/artist/i, /sound/i, /music/i]
  }, {
    class: 'fa-flag',
    code: '\uf024',
    'patterns': [/country/i, /warn/i, /flag/i]
  }, {
    class: 'fa-tag',
    code: '\uf02b',
    'patterns': [/tag/i, /label/i]
  }, {
    class: 'fa-phone',
    code: '\uf095',
    'patterns': [/phone/i]
  }, {
    class: 'fa-desktop',
    code: '\uf108',
    'patterns': [/host/i, /server/i]
  }, {
    class: 'fa-font',
    code: '\uf031',
    'patterns': [/text/i, /title/i, /body/i, /desc/i]
  }, {
    class: 'fa-at',
    code: '\uf1fa',
    'patterns': [/account/i, /email/i]
  }, {
    class: 'fa-heart',
    code: '\uf004',
    'patterns': [/like/i, /favourite/i, /favorite/i]
  }, {
    class: 'fa-bolt',
    code: '\uf0e7',
    'patterns': [/action/i]
  }, {
    class: 'fa-map-marker',
    code: '\uf041',
    'patterns': [/location/i, /geo/i, /position/i]
  }, {
    class: 'fa-exclamation',
    code: '\uf12a',
    'patterns': [/risk/i, /error/i, /warn/i]
  }, {
    class: 'fa-industry',
    code: '\uf275',
    'patterns': [/business/i, /company/i, /industry/i, /organisation/i]
  }
];

export var iconChoicesByClass = {};

for (var i in iconChoices) {
  var icon = iconChoices[i];
  iconChoicesByClass[icon.class] = icon;
}

export function getIconsByClass() {
  var iconChoicesByClass = {};
  for (var i in iconChoices) {
    var icon = iconChoices[i];
    iconChoicesByClass[icon.class] = icon;
  }
  return iconChoicesByClass;
}

export const colorChoices = ['#99bde7', '#e3d754', '#8ee684', '#e7974c', '#e4878d', '#67adab',
  '#43ebcc', '#e4b4ea', '#a1a655', '#78b36e'];
