# Demo Script Examples

Copyright (c) 2020, Oracle and/or its affiliates.

[Back](../README.md)

## NOTICE

The bot has already some general knowledge which is hard to press into single demo script. It can answer already various questions in combinations and due to the decision trees based branching can have dependencies between the intents, or dependancies when entities change. The dialogs are still in development process. Following are few examples of what could be achieved with this Smalltalk bot and the Dialog Custom Component.

### Since 21 Nov 2018 (since v3)

```Text
User: "Hi"
Bot: "hi, I am your chit chat bot, how can I help you?"

User: "how are you today"
Bot: "Looks like a good day ahead"

User: "can you play some music"
Bot: "No"

User: "why not?"
Bot: "Use spotify:)"

User: "you are funny"
Bot: "I use spotify, no jokes!"

User: "you are the best bot I ever talk to"
Bot: "I do my best."
```

### CHANGE Since May 20, 2018

```Text
User: “what is your favorite music”
Bot: “lately a lot of heavy metal"

User: “yes”
Bot: “you like rock music too, what?"

User: “yes, I do”
Bot: “great, we could go to a party together, when I get out of here:)"
```

### CHANGE Since May 18, 2018

You can now also switch to a new intent directly:

```Text
User: “can you tell me joke”
Bot: “What do dogs do when watching a DVD? They press paws."

User: “hahahah, very funny, tell me another one”
Bot: “Why did the belt go to jail? He held up a pair of pants."
```

### CHANGE Since May 17, 2018

There is a change in the decision tree dialog flow, which now allows you to switch between intents with dependancies. For example, following scenario:

```Text
User: “can you tell me joke”
Bot: “What do dogs do when watching a DVD? They press paws."

User: “hahahah, very funny, tell me another one”
Bot: “You mean another joke?”

User: “Yes”
Bot: “OK, no problem, Why did the belt go to jail? He held up a pair of pants."
```

### General Questions

> What are you? Are you bot? Are you Human?\
> Who made you? Who build you? Who invented you?\
> How much do you cost?  What’s your price?  Are you free?\
> What technologies do you use?  Are you open source?\
> What else can you do?  Can you integrate to other backend systems?\
> When were you born? When were you made available?\
> Do you support voice activated assistants like Siri? Alexa? Google?\
> Do you work with Facebook Messenger?\
> Who are your creators?\
> What is the answer to the universe?\
> What is your name?\
> Where do you live?\

### Bad Experience

>User: not happy with your answer\
>Bot: Sorry to hear that!\
\
>User: no, you don't\
>Bot: believe me I do and I am sorry that your experience is not satisfying, let me know what else I could do for you?\
\
>User: ok, there is something you can do for me\
>Bot: ok, go ahead, ask your question in a way I can understand and I will do my best to provide you guidance:)

### Greetings

>hi\
>how are you today\
>I am doing great, thanks!\

### Repeating Question

>User: where do you live?\
>(bot answer)
>>User: where do you live?\
>>(bot answer)
>>>User: where do you live?\
>>>(bot answer)
>>>>User: where do you live?\
>>>>(bot answer that is not happy to be asked the same)\
>>>>User:where do you live?\
>>>>(bot answer that is not happy to be asked the same)

### BadExperience In Different Form

>User: what can you do for me?\
>(bot answer)
\
\
>User: not happy with that short answer\
>(bot answer now specifically for bad experience after skills set asked)
\
\
>User:what will be the weather today?\
>(bot answer)
\
\
>User: not happy with that answer\
>(bot now answers differently because we didn't ask about skills anymore)

### Other examples

Ask about feeling?
>how do you feel?

Ask for confidece?
>you sure?

Try good morning, afternoon or evening when is not and once when it is really morning?

>good morning (if it’s not good morning for example)\
>good evening or afternoon (when it is not)

Try happy xmas, when it is not:)?

> happy xmas

### NOTICE: The bot is delivered with predefine dialogs, you can change them, add new or remove dialogs at will
