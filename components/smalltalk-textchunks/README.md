# README

This folder contains the text chunks that can be used to construct more complex sentences with, for example:

```YAML
"{{$$textChunk.solala}}....some other text here :)"
```

where `solala` is the name of the text chunk specified in the configuration file, for example:

```JSON
  "solala": {
    "dialogs": [
      {
        "replays": [
          "well",
          "hmm",
          "yeah",
          "so"
        ]
      }
    ]
  }
```

As you can see you can have also more than one file. If the some of the names repeat however, the princip will be the last one wins. You can use however separate files for multilanguage, for example loading for german language could be:

```JSON
  "solala-de": {
    "dialogs": [
      {
        "replays": [
          "aha",
          "hmm",
          "so so",
          "ah ja"
        ]
      }
    ]
  }
  ```

And later used like this:

```YAML
"{{$$textChunk.solala-de}}....das ist noch ein Text!"
```

In ODA YAML it would look like this:

```YAML
  Branches:
    component: "Branch"
    properties:
      branches:
        - intent: "AskConfidence"
          interceptor: ""
          responseOptions:
              - properties:  
                decisionActionProperties:
                actions: 
                responseItems:
                  - text:
                    - "{{$$textChunk.confidence}}"
```
