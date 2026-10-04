import {
  LitElement,
  html,
} from "https://unpkg.com/lit-element@2.0.1/lit-element.js?module";

class NFLCard extends LitElement {

  static get properties() {
    return {
      hass: {},
      _config: {},
    };
  }

  setConfig(config) {
    this._config = config;
  }
  getCardSize() {
    return 5;
  }

  // ---- Logo tap actions ---------------------------------------------------
  // side is 'team' or 'opponent'. Returns the action config for that logo,
  // or undefined if none is configured.
  _getLogoAction(side) {
    const action = this._config[`${side}_tap_action`] || this._config.logo_tap_action;
    if (!action || action.action === 'none') return undefined;
    return action;
  }

  // Replace {team_name}, {team_abbr}, {team_id}, {side}, etc. in strings so a
  // single action definition can refer to whichever logo was tapped.
  _fillPlaceholders(value, side) {
    if (typeof value === 'string') {
      const attrs = this.hass.states[this._config.entity].attributes;
      return value.replace(/\{(side|entity|team_[a-z_]+|opponent_[a-z_]+)\}/g, (m, key) => {
        if (key === 'side') return side;
        if (key === 'entity') return this._config.entity;
        // {team_*} refers to the tapped team; {opponent_*} to the other one.
        const other = side === 'team' ? 'opponent' : 'team';
        const attrKey = key.startsWith('team_')
          ? `${side}_${key.slice(5)}`
          : `${other}_${key.slice(9)}`;
        return attrs[attrKey] !== undefined ? String(attrs[attrKey]) : m;
      });
    }
    if (Array.isArray(value)) return value.map((v) => this._fillPlaceholders(v, side));
    if (value && typeof value === 'object') {
      const out = {};
      for (const [k, v] of Object.entries(value)) out[k] = this._fillPlaceholders(v, side);
      return out;
    }
    return value;
  }

  _fireEvent(type, detail) {
    this.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true }));
  }

  _handleLogoTap(ev, side) {
    ev.stopPropagation();
    const raw = this._getLogoAction(side);
    if (!raw) return;
    const action = this._fillPlaceholders(raw, side);

    if (action.confirmation) {
      const text = typeof action.confirmation === 'object' && action.confirmation.text
        ? action.confirmation.text
        : `Are you sure you want to run this action?`;
      if (!window.confirm(text)) return;
    }

    switch (action.action) {
      case 'more-info':
        this._fireEvent('hass-more-info', { entityId: action.entity || this._config.entity });
        break;
      case 'navigate':
        if (!action.navigation_path) break;
        if (action.navigation_replace) {
          history.replaceState(null, '', action.navigation_path);
        } else {
          history.pushState(null, '', action.navigation_path);
        }
        this._fireEvent('location-changed', { replace: !!action.navigation_replace });
        break;
      case 'url':
        if (action.url_path) window.open(action.url_path);
        break;
      case 'toggle':
        if (action.entity) {
          this.hass.callService('homeassistant', 'toggle', { entity_id: action.entity });
        }
        break;
      case 'perform-action':
      case 'call-service': {
        const svc = action.perform_action || action.service;
        if (!svc || !svc.includes('.')) break;
        const [domain, service] = svc.split('.', 2);
        const data = action.data || action.service_data || {};
        this.hass.callService(domain, service, data, action.target);
        break;
      }
      case 'fire-dom-event':
        this._fireEvent('ll-custom', action);
        break;
      default:
        console.warn('nfl-card: unsupported tap action', action);
    }
  }

  // Renders a team logo, wiring up a tap action if one is configured.
  _logo(side, src) {
    const action = this._getLogoAction(side);
    if (!action) return html`<img src="${src}" />`;
    return html`<img
      class="clickable"
      src="${src}"
      role="button"
      tabindex="0"
      title="${action.title || ''}"
      @click=${(ev) => this._handleLogoTap(ev, side)}
      @keydown=${(ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); this._handleLogoTap(ev, side); } }}
    />`;
  }

  render() {
    if (!this.hass || !this._config) {
      return html``;
    }

    const stateObj = this.hass.states[this._config.entity];
    if (!stateObj) {
      return html` <ha-card>Unknown entity: ${this._config.entity}</ha-card> `;
    }
    const outline = this._config.outline;
    const outlineColor = this._config.outline_color;
    const locale = this._config.locale;
    const disableOdds = this._config.disable_odds;
    const teamProb = (stateObj.attributes.team_win_probability * 100).toFixed(0);
    const oppoProb = (stateObj.attributes.opponent_win_probability * 100).toFixed(0);
    var tScr = stateObj.attributes.team_score;
    var oScr = stateObj.attributes.opponent_score;

    var dateForm = new Date (stateObj.attributes.date);
    var gameDay = dateForm.toLocaleDateString(locale, { weekday: 'long' });
    var gameTime = dateForm.toLocaleTimeString(locale, { hour: '2-digit', minute:'2-digit' });
    var gameMonth = dateForm.toLocaleDateString(locale, { month: 'short' });
    var gameDate = dateForm.toLocaleDateString(locale, { day: '2-digit' });
    var gameDateLong = dateForm.toLocaleDateString(locale, { month: 'long', day: 'numeric', year: 'numeric'});
    var outColor = outlineColor;
    
    if (outline == true) {
      var clrOut = 1;
      var toRadius = 4;
      var probRadius = 7;
    }
    if (!this._config.outline || outline == false){
      var clrOut = 0;
      var toRadius = 3;
      var probRadius = 6;
    }
    if (!this._config.outline_color) {
      var outColor = '#ffffff';
    }
    if (stateObj.attributes.possession == stateObj.attributes.team_id) {
      var teamPoss = 1;
    }
    if (stateObj.attributes.possession == stateObj.attributes.opponent_id) {
      var oppoPoss = 1;
    }
    if (Boolean(stateObj.state == 'POST') && Number(tScr) > Number(oScr)) {
        var oppoScore = 0.6;
        var teamScore = 1;
    }
    if (Boolean(stateObj.state == 'POST') && Number(tScr) < Number(oScr)) {
        var oppoScore = 1;
        var teamScore = 0.6;
    }
    if (Boolean(stateObj.state == 'POST') && Number(tScr) == Number(oScr)) {
        var oppoScore = 1;
        var teamScore = 1;
    }


    if (stateObj.attributes.team_homeaway == 'home') {
      var teamColor = stateObj.attributes.team_colors[0];
      var oppoColor = stateObj.attributes.opponent_colors[1];
    }
    if (stateObj.attributes.team_homeaway == 'away') {
      var teamColor = stateObj.attributes.team_colors[1];
      var oppoColor = stateObj.attributes.opponent_colors[0];
    }

    if (stateObj.state == 'unavailable') {
      return html`
        <style>
          ha-card {padding: 10px 16px;}
        </style>
        <ha-card>
          Sensor unavailable: ${this._config.entity}
        </ha-card> 
      `;
    }

    if (stateObj.state == 'POST') {
      return html`
        <style>
          .card { position: relative; overflow: hidden; padding: 16px 16px 20px; font-weight: 400; }
          .team-bg { opacity: 0.08; position: absolute; top: -30%; left: -20%; width: 58%; z-index: 0; }
          .opponent-bg { opacity: 0.08; position: absolute; top: -30%; right: -20%; width: 58%; z-index: 0; }
          .card-content { display: flex; justify-content: space-evenly; align-items: center; text-align: center; position: relative; z-index: 1; }
          .team { text-align: center; width: 35%;}
          .team img { max-width: 90px; }
          .team img.clickable { cursor: pointer; }
          .score { font-size: 3em; text-align: center; }
          .teamscr { opacity: ${teamScore}; }
          .opposcr { opacity: ${oppoScore}; }
          .divider { font-size: 2.5em; text-align: center; opacity: 0; }
          .name { font-size: 1.4em; margin-bottom: 4px; }
          .line { height: 1px; background-color: var(--primary-text-color); margin:10px 0; }
          .status { font-size: 1.2em; text-align: center; margin-top: -21px; }
        </style>
        <ha-card>
          <div class="card">
            <img class="team-bg" src="${stateObj.attributes.team_logo}" />
            <img class="opponent-bg" src="${stateObj.attributes.opponent_logo}" />
            <div class="card-content">
              <div class="team">
                ${this._logo('team', stateObj.attributes.team_logo)}
                <div class="name">${stateObj.attributes.team_name}</div>
                <div class="record">${stateObj.attributes.team_record}</div>
              </div>
              <div class="score teamscr">${tScr}</div>
              <div class="divider">-</div>
              <div class="score opposcr">${oScr}</div>
              <div class="team">
                ${this._logo('opponent', stateObj.attributes.opponent_logo)}
                <div class="name">${stateObj.attributes.opponent_name}</div>
                <div class="record">${stateObj.attributes.opponent_record}</div>
              </div>
            </div>
            <div class="status">${gameMonth} ${gameDate} - FINAL</div>
          </div>
        </ha-card>
      `;
    }


    if (stateObj.state == 'IN') {
        return html`
          <style>
            .card { position: relative; overflow: hidden; padding: 0 16px 20px; font-weight: 400; }
            .team-bg { opacity: 0.08; position:absolute; top: -20%; left: -20%; width: 58%; z-index: 0; }
            .opponent-bg { opacity: 0.08; position:absolute; top: -20%; right: -20%; width: 58%; z-index: 0; }
            .card-content { display: flex; justify-content: space-evenly; align-items: center; text-align: center; position: relative; z-index: 1; }
            .team { text-align: center; width:35%; }
            .team img { max-width: 90px; }
          .team img.clickable { cursor: pointer; }
            .possession, .teamposs, .oppoposs { font-size: 2.5em; text-align: center; opacity: 0; font-weight:900; }
            .teamposs {opacity: ${teamPoss} !important; }
            .oppoposs {opacity: ${oppoPoss} !important; }
            .score { font-size: 3em; text-align: center; }
            .divider { font-size: 2.5em; text-align: center; margin: 0 4px; }
            .name { font-size: 1.4em; margin-bottom: 4px; }
            .line { height: 1px; background-color: var(--primary-text-color); margin:10px 0; }
            .timeouts { margin: 0 auto; width: 70%; }
            .timeouts div.opponent-to:nth-child(-n + ${stateObj.attributes.opponent_timeouts})  { opacity: 1; }
            .timeouts div.team-to:nth-child(-n + ${stateObj.attributes.team_timeouts})  { opacity: 1; }
            .team-to { height: 6px; border-radius: ${toRadius}px; border: ${clrOut}px solid ${outColor}; width: 20%; background-color: ${teamColor}; display: inline-block; margin: 0 auto; position: relative; opacity: 0.2; }
            .opponent-to { height: 6px; border-radius: ${toRadius}px; border: ${clrOut}px solid ${outColor}; width: 20%; background-color: ${oppoColor}; display: inline-block; margin: 0 auto; position: relative; opacity: 0.2; }
            .status { text-align:center; font-size:1.6em; font-weight: 700; }
            .sub1 { font-weight: 700; font-size: 1.2em; margin: 6px 0 2px; }
            .sub1, .sub2, .sub3 { display: flex; justify-content: space-between; align-items: center; margin: 2px 0; }
            .last-play { font-size: 1.2em; width: 100%; white-space: nowrap; overflow: hidden; box-sizing: border-box; }
            .last-play p { display: inline-block; padding-left: 100%; margin: 2px 0 12px; animation : slide 18s linear infinite; }
            @keyframes slide { 0%   { transform: translate(0, 0); } 100% { transform: translate(-100%, 0); } }
            .clock { text-align: center; font-size: 1.4em; }
            .down-distance { text-align: right; }
            .play-clock { font-size: 1.4em; text-align: center; margin-top: -24px; }
            .probability-text { text-align: center; ${disableOdds ? 'display: none;' : ''}}
            .prob-flex { width: 100%; display: flex; justify-content: center; margin-top: 4px; }
            .opponent-probability { width: ${oppoProb}%; background-color: ${oppoColor}; height: 12px; border-radius: 0 ${probRadius}px ${probRadius}px 0; border: ${clrOut}px solid ${outColor}; border-left: 0; transition: all 1s ease-out; }
            .team-probability { width: ${teamProb}%; background-color: ${teamColor}; height: 12px; border-radius: ${probRadius}px 0 0 ${probRadius}px; border: ${clrOut}px solid ${outColor}; border-right: 0; transition: all 1s ease-out; }
            .probability-wrapper { ${disableOdds ? 'display: none;' : 'display: flex;'}; }
            .team-percent { flex: 0 0 10px; padding: 0 10px 0 0; }
            .oppo-percent { flex: 0 0 10px; padding: 0 0 0 10px; text-align: right; }
            .percent { padding: 0 6px; }
            .post-game { margin: 0 auto; }
          </style>
          <ha-card>
            <div class="card">
            <img class="team-bg" src="${stateObj.attributes.team_logo}" />
            <img class="opponent-bg" src="${stateObj.attributes.opponent_logo}" />
            <div class="card-content">
              <div class="team">
                ${this._logo('team', stateObj.attributes.team_logo)}
                <div class="name">${stateObj.attributes.team_name}</div>
                <div class="record">${stateObj.attributes.team_record}</div>
                <div class="timeouts">
                  <div class="team-to"></div>
                  <div class="team-to"></div>
                  <div class="team-to"></div>
                </div>
              </div>
              <div class="teamposs">&bull;</div>
              <div class="score">${stateObj.attributes.team_score}</div>
              <div class="divider">-</div>
              <div class="score">${stateObj.attributes.opponent_score}</div>
              <div class="oppoposs">&bull;</div>
              <div class="team">
                ${this._logo('opponent', stateObj.attributes.opponent_logo)}
                <div class="name">${stateObj.attributes.opponent_name}</div>
                <div class="record">${stateObj.attributes.opponent_record}</div>
                <div class="timeouts">
                  <div class="opponent-to"></div>
                  <div class="opponent-to"></div>
                  <div class="opponent-to"></div>
                </div>
              </div>
            </div>
            <div class="play-clock">Q${stateObj.attributes.quarter} - ${stateObj.attributes.clock}</div>
            <div class="line"></div>
            <div class="sub2">
              <div class="venue">${stateObj.attributes.venue}</div>
             <div class="down-distance">${stateObj.attributes.down_distance_text}</div>
            </div>
            <div class="sub3">
              <div class="location">${stateObj.attributes.location}</div>
              <div class="network">${stateObj.attributes.tv_network}</div>
            </div>
            <div class="line"></div>
            <div class="last-play">
              <p>${stateObj.attributes.last_play}</p>
            </div>
            <div class="probability-text">Win Probability</div>
            <div class="probability-wrapper">
              <div class="team-percent">${teamProb}%</div>
              <div class="prob-flex">
                <div class="team-probability"></div>
                <div class="opponent-probability"></div>
              </div>
              <div class="oppo-percent">${oppoProb}%</div>
            </div>
          </div>
          </ha-card>
        `;
    }

    if (stateObj.state == 'PRE') {
        return html`
          <style>
            .card { position: relative; overflow: hidden; padding: 0 16px 20px; font-weight: 400; }
            .team-bg { opacity: 0.08; position:absolute; top: -20%; left: -20%; width: 58%; z-index: 0; }
            .opponent-bg { opacity: 0.08; position:absolute; top: -20%; right: -20%; width: 58%; z-index: 0; }
            .card-content { display: flex; justify-content: space-evenly; align-items: center; text-align: center; position: relative; z-index: 1; }
            .team { text-align: center; width: 35%; }
            .team img { max-width: 90px; }
          .team img.clickable { cursor: pointer; }
            .name { font-size: 1.4em; margin-bottom: 4px; }
            .line { height: 1px; background-color: var(--primary-text-color); margin:10px 0; }
            .gameday { font-size: 1.4em; margin-bottom: 4px; }
            .gametime { font-size: 1.1em; }
            .sub1 { font-weight: 500; font-size: 1.2em; margin: 6px 0 2px; }
            .sub1, .sub2, .sub3 { display: flex; justify-content: space-between; align-items: center; margin: 2px 0; }
            .last-play { font-size: 1.2em; width: 100%; white-space: nowrap; overflow: hidden; box-sizing: border-box; }
            .last-play p { display: inline-block; padding-left: 100%; margin: 2px 0 12px; animation : slide 10s linear infinite; }
            @keyframes slide { 0%   { transform: translate(0, 0); } 100% { transform: translate(-100%, 0); } }
            .clock { text-align: center; font-size: 1.4em; }
            .down-distance { text-align: right; font-weight: 700; }
            .kickoff { text-align: center; margin-top: -24px; }
            .odds {${disableOdds ? 'display: none;' : ''}}
            .overunder {${disableOdds ? 'display: none;' : '' }}
            .date {${disableOdds ? '' : 'display: none;' }}
            .time {${disableOdds ? '' : 'display: none;' }}
          </style>
          <ha-card>
              <div class="card">
              <img class="team-bg" src="${stateObj.attributes.team_logo}" />
              <img class="opponent-bg" src="${stateObj.attributes.opponent_logo}" />
              <div class="card-content">
                <div class="team">
                  ${this._logo('team', stateObj.attributes.team_logo)}
                  <div class="name">${stateObj.attributes.team_name}</div>
                  <div class="record">${stateObj.attributes.team_record}</div>
                </div>
                <div class="gamewrapper">
                  <div class="gameday">${gameDay}</div>
                  <div class="gametime">${gameTime}</div>
                </div>
                <div class="team">
                  ${this._logo('opponent', stateObj.attributes.opponent_logo)}
                  <div class="name">${stateObj.attributes.opponent_name}</div>
                  <div class="record">${stateObj.attributes.opponent_record}</div>
                </div>
              </div>
              <div class="line"></div>
              <div class="sub1">
                <div class="kickoff-in">Kickoff ${stateObj.attributes.kickoff_in}</div>
                <div class="odds">${stateObj.attributes.odds}</div>
                <div class="date">${gameDateLong}</div>
              </div>
              <div class="sub2">
                <div class="venue">${stateObj.attributes.venue}</div>
                <div class="overunder"> O/U: ${stateObj.attributes.overunder}</div>
                <div class="time">${gameTime}</div>
              </div>
              <div class="sub3">
                <div class="location">${stateObj.attributes.location}</div>
                <div class="network">${stateObj.attributes.tv_network}</div>
              </div>
            </div>
            </ha-card>
        `;
    }

    if (stateObj.state == 'BYE') {
      return html`
        <style>
          .card { position: relative; overflow: hidden; padding: 16px 16px 20px; font-weight: 400; }
          .team-bg { opacity: 0.08; position: absolute; top: -20%; left: -30%; width: 75%; z-index: 0; }
          .card-content { display: flex; justify-content: space-evenly; align-items: center; text-align: center; position: relative; z-index: 1; }
          .team { text-align: center; width: 50%; }
          .team img { max-width: 90px; }
          .team img.clickable { cursor: pointer; }
          .name { font-size: 1.6em; margin-bottom: 4px; }
          .line { height: 1px; background-color: var(--primary-text-color); margin:10px 0; }
          .bye { font-size: 1.8em; text-align: center; width: 50%; }
        </style>
        <ha-card>
          <div class="card">
            <img class="team-bg" src="${stateObj.attributes.team_logo}" />
            <div class="card-content">
              <div class="team">
                ${this._logo('team', stateObj.attributes.team_logo)}
                <div class="name">${stateObj.attributes.team_name}</div>
                <div class="record">${stateObj.attributes.team_record}</div>
              </div>
              <div class="bye">BYE</div>
            </div>
          </div>
        </ha-card>
      `;
    }

    if (stateObj.state == 'NOT_FOUND') {
      return html`
        <style>
          .card { position: relative; overflow: hidden; padding: 16px 16px 20px; font-weight: 400; }
          .team-bg { opacity: 0.08; position: absolute; top: -50%; left: -30%; width: 75%; z-index: 0; }
          .card-content { display: flex; justify-content: space-evenly; align-items: center; text-align: center; position: relative; z-index: 1; }
          .team { text-align: center; width: 50%; }
          .team img { max-width: 90px; }
          .team img.clickable { cursor: pointer; }
          .name { font-size: 1.6em; margin-bottom: 4px; }
          .line { height: 1px; background-color: var(--primary-text-color); margin:10px 0; }
          .eos { font-size: 1.8em; line-height: 1.2em; text-align: center; width: 50%; }
        </style>
        <ha-card>
          <div class="card">
            <img class="team-bg" src="https://a.espncdn.com/i/espn/misc_logos/500/nfl.png" />
            <div class="card-content">
              <div class="team">
                <img src="https://a.espncdn.com/i/espn/misc_logos/500/nfl.png" />
              </div>
              <div class="eos">Better Luck<br />Next Year</div>
            </div>
          </div>
        </ha-card>
      `;
    }
  }
}

customElements.define("nfl-card", NFLCard);
