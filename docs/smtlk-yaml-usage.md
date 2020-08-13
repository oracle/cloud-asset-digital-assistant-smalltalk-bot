# Use in YAML

Copyright (c) 2020, Oracle and/or its affiliates.

[Back](../README.md)

## Instructions

We are working on documentation to show you how to use the Smart Dialog Component, this documentation would give you some high level information.

To do this type of integration:

- import the skill
- train the skill
- select your main bot skill that should integrate some smalltalk capabilities
- check following YAML example of how we did the integration: [ODA YAML EXAMPLE](smalltalkyamlintegrationexample.yaml)

`From the YAML following is important to notice:`

*This is how you can register text chunks to use to build more complicated sentences

```YAML
    TextChunksSMT:
        component: "TextChunks"
        properties:
            responseOptions:
```

`you can use the chunks like this later`

```YAML
    responseItems:
        - text:
        - "{{$$textChunk.solala}}....but let me see the ring first :)"
```

### Introduction to the `branch` component

Branches allows you build logic depending on the current intent and the entities\

`branches`: independant part, can be considered as own decision tree set of logics, that contains one or many logics\
&nbsp;&nbsp;`intent`: is the name of the intent or last used intent in case the intent didn't change only the entities\
&nbsp;&nbsp;`responseOptions`: has several properties, as described below\
&nbsp;&nbsp;&nbsp;`properties`: contains `<entitie>:<value>` that has to much for given intent in order for the leaf to get executed. `$lastIntent` basically checks if the intent called or used before the current one was having specific name. `YES_NO: "NO"` is the name of the coresponding entity from ODA with has to have value `NO` \
&nbsp;&nbsp;&nbsp;`decisionActionProperties`: allows to specify own `<entity>:<value>` at that leaf. It could be used to change the execution logic, because everything that has be set here will be during the next `properties` check lifecycle.\
&nbsp;&nbsp;&nbsp;`actions`: it has 2 reserved words:\

&nbsp;&nbsp;&nbsp;&nbsp;`$gotoIntentNow` - it allows to transition to a new intent, it takes all current and additional action properties to the new state!\
&nbsp;&nbsp;&nbsp;&nbsp;`$gotoIntent` - it transitions to a new intent, after user response, yet again it takes all current and additional action properties to the new state!\

&nbsp;&nbsp;&nbsp;`responseItems` - allows to specify bot response as text. It can have 1 or more response specified. In case of more than one response, they will be randomized. The responses can also have place holders, that can be entity values, for example: `"{{user.name}}....I thought so"` If the value of `user.name` is undefined, this text will not be used as response and an alternative text will be used, if such exit.\n

&nbsp;&nbsp;&nbsp;`transition` - if set, `responseItems` will not be used and the YAML state will be sent to the state specified for that value.

```YAML
  BranchesSMT:
    component: "Branch"
    properties:
      branches:
        - intent: "AskConfidence"
          interceptor: ""
          responseOptions:
              - properties:
                  $lastIntent: "Marry"
                  YES_NO: "NO"
                decisionActionProperties:
                actions:
                transition:
                responseItems:
                  - text:
                    - "{{$$textChunk.solala}}....I thought so"
```

