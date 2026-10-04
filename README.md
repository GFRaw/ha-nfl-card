# Home Assistant NFL Card
A Home Assistant frontend custom card for the [ha-nfl](https://github.com/zacs/ha-nfl) integration.

#### &nbsp;&nbsp;&nbsp;PREGAME

![pregame](https://user-images.githubusercontent.com/9123670/138403165-fe83a2f1-7ecd-4b47-8915-17c84d69a8e5.png)

#### &nbsp;&nbsp;&nbsp;IN GAME

![ingame](https://user-images.githubusercontent.com/9123670/138606167-0d6416e4-e58b-454f-8cc3-e67dcbf42372.png)

#### &nbsp;&nbsp;&nbsp;POSTGAME

![postgame](https://user-images.githubusercontent.com/9123670/138403233-c61f13d8-6aad-43ac-ae45-213b767d7f96.png)

#### &nbsp;&nbsp;&nbsp;BYE

![bye](https://user-images.githubusercontent.com/9123670/138403291-bbded2aa-c8d4-42f7-b7bf-1578436c1076.png)


## HACS Installation
 - In the HACS UI, click the 3 dots in the upper right
 - Click 'Add Custom Repository'
 - Fill in the repo url https://github.com/D34DC3N73R/ha-nfl-card and choose 'Lovelace' category.
 - install the custom card
 - Add the following to your resources
```
url: /hacsfiles/ha-nfl-card/ha-nfl-card.js
type: module
```

## Manual Installation
 - Download [ha-nfl-card.js](https://raw.githubusercontent.com/D34DC3N73R/ha-nfl-card/main/dist/ha-nfl-card.js)
 - Copy to www/community/ha-nfl-card/ (make the ha-nfl-card directory)
 - Add the following to your resources
```
url: /hacsfiles/ha-nfl-card/ha-nfl-card.js
type: module
```

## Options
| Name | Description | Default | Required |  Values |
| --- | --- | --- | --- | --- |
| `entity` | Name of ha-nfl sensor | `sensor.nfl` | Yes  | Valid sensor |
| `outline` | Outline team colors (helpful w/ dark themes) |`false` | No |  `true` `false` |
| `outline_color` | Specifies outline color. | `white` | No |  CSS color or hex value  |
| `locale` | Specifies the locale to use for date and time. | `en-US` | No | A valid [locale code.](https://simplelocalize.io/data/locales/) |
| `disable_odds` | Disables displaying "odds", "over/under", and "Win Probability" |  `false` | No | `true` `false` |
| `team_tap_action` | Action to run when your team's logo is tapped | none | No | [Action config](#logo-tap-actions) |
| `opponent_tap_action` | Action to run when the opponent's logo is tapped | none | No | [Action config](#logo-tap-actions) |
| `logo_tap_action` | Fallback action used for either logo when the side-specific option isn't set | none | No | [Action config](#logo-tap-actions) |

## Logo Tap Actions
Tapping a team logo can run a Home Assistant action. The config follows the standard
[Lovelace action](https://www.home-assistant.io/dashboards/actions/) format.

| `action` | Extra keys |
| --- | --- |
| `perform-action` (or `call-service`) | `perform_action` (or `service`), `data` (or `service_data`), `target` |
| `navigate` | `navigation_path`, `navigation_replace` |
| `url` | `url_path` |
| `more-info` | `entity` (defaults to the card's sensor) |
| `toggle` | `entity` |
| `fire-dom-event` | anything (sent with the `ll-custom` event) |
| `none` | – |

Every action also accepts `confirmation` (`true`, or `{text: "..."}`) and `title` (hover tooltip).

Any string in the action can use placeholders, filled in from the sensor's attributes when tapped.
`{team_*}` refers to the **tapped** team and `{opponent_*}` to the other one, so one `logo_tap_action`
works for both logos. Examples: `{team_name}`, `{team_abbr}`, `{team_id}`, `{opponent_name}`,
`{side}` (`team` or `opponent`), `{entity}`.

```
type: 'custom:nfl-card'
entity: sensor.nfl
team_tap_action:
  action: perform-action
  perform_action: script.touchdown_lights
  data:
    team: '{team_abbr}'
opponent_tap_action:
  action: url
  url_path: 'https://www.espn.com/nfl/team/_/name/{team_abbr}'
```

```
type: 'custom:nfl-card'
entity: sensor.nfl
logo_tap_action:
  action: perform-action
  perform_action: notify.mobile_app_phone
  confirmation:
    text: Send a notification?
  data:
    message: 'Go {team_name}! (vs {opponent_name})'
```

## Examples
```
type: 'custom:nfl-card'
entity: sensor.nfl
outline: true
outline_color: deeppink
```
![example](https://user-images.githubusercontent.com/9123670/138405243-8e42db4f-7d69-40bc-8ea7-624c31a957a9.png)


```
type: 'custom:nfl-card'
entity: sensor.nfl
outline: true
outline_color: '#ffe500'
```
![example2](https://user-images.githubusercontent.com/9123670/138405612-8efbb117-4f4b-4eb9-8ef0-339e9b35c868.png)

```
type: 'custom:nfl-card'
entity: sensor.nfl
outline: true
outline_color: '#E31837'
disable_odds: true
```
![example3](https://raw.githubusercontent.com/20bbrown14/ha-nfl-card/master/.github/example_odds_disabled.png)

## Minimal Required Configuration
```
type: 'custom:nfl-card'
entity: sensor.nfl
```
Where `sensor.nfl` is the sensor name from the [ha-nfl](https://github.com/zacs/ha-nfl) integration.
