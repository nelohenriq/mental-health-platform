# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - navigation [ref=e2]:
    - navigation "breadcrumb" [ref=e4]:
      - list [ref=e5]:
        - listitem [ref=e6]:
          - link "Home" [ref=e7]:
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
  - generic:
    - generic [ref=e23] [cursor=pointer]:
      - img [ref=e24]
      - generic [ref=e26]: 1 error
      - button "Hide Errors" [ref=e27]:
        - img [ref=e28]
    - status [ref=e31]:
      - generic [ref=e32]:
        - img [ref=e34]
        - generic [ref=e36]:
          - text: Static route
          - button "Hide static indicator" [ref=e37] [cursor=pointer]:
            - img [ref=e38]
  - alert [ref=e41]
```