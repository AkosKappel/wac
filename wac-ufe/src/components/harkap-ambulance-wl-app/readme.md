# harkap-ambulance-wl-app



<!-- Auto Generated Below -->


## Properties

| Property   | Attribute   | Description | Type     | Default     |
| ---------- | ----------- | ----------- | -------- | ----------- |
| `apiBase`  | `api-base`  |             | `string` | `undefined` |
| `basePath` | `base-path` |             | `string` | `''`        |


## Dependencies

### Depends on

- [harkap-ambulance-home](../harkap-ambulance-home)
- [harkap-ambulance-wl-list](../harkap-ambulance-wl-list)
- [harkap-ambulance-wl-editor](../harkap-ambulance-wl-editor)
- [harkap-ambulance-maintenance](../harkap-ambulance-maintenance)
- [harkap-ambulance-departments](../harkap-ambulance-departments)
- [harkap-ambulance-about](../harkap-ambulance-about)

### Graph
```mermaid
graph TD;
  harkap-ambulance-wl-app --> harkap-ambulance-home
  harkap-ambulance-wl-app --> harkap-ambulance-wl-list
  harkap-ambulance-wl-app --> harkap-ambulance-wl-editor
  harkap-ambulance-wl-app --> harkap-ambulance-maintenance
  harkap-ambulance-wl-app --> harkap-ambulance-departments
  harkap-ambulance-wl-app --> harkap-ambulance-about
  harkap-ambulance-wl-editor --> harkap-ambulance-log-editor
  harkap-ambulance-wl-editor --> harkap-ambulance-log-list
  style harkap-ambulance-wl-app fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
