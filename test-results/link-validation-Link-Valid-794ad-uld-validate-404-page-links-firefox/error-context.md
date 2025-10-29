# Page snapshot

```yaml
- generic [ref=e1]:
  - navigation [ref=e2]:
    - navigation "breadcrumb" [ref=e4]:
      - list [ref=e5]:
        - listitem [ref=e6]:
          - link "Home" [active] [ref=e7] [cursor=pointer]:
            - /url: /
            - img [ref=e8]
            - text: Home
        - listitem [ref=e11]:
          - img [ref=e12]
        - listitem [ref=e14]:
          - link "Non-existent-page" [disabled] [ref=e15]
  - generic [ref=e17]:
    - heading "404" [level=1] [ref=e18]
    - heading "This page could not be found." [level=2] [ref=e20]
  - status [ref=e21]:
    - generic [ref=e22]:
      - img [ref=e24]
      - generic [ref=e26]:
        - text: Static route
        - button "Hide static indicator" [ref=e27] [cursor=pointer]:
          - img [ref=e28]
  - alert [ref=e31]
```