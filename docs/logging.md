This file documents the logging (or logs the logs if you like)
After comparing Google Analytics and Mixpanel, we decided to use mixpanel for logging

useAutoTrackClicks.ts , analitics.ts

how to use?
    add to props at least the follwing attributs
        data-track-click="" // event name
        button-name=""

logged buttons:
Send word
```   
    data-track-click="Button clicked" // event name
    button-name="Send word"
```

Suggestion word card
```
    data-track-click="Dynamic button clicked" // event name
    button-name="Word suggestion"
    button-category={category}
    button-word={word}
```

Record word button
Event Name: `Text transcripted`
```
  {"word":text}
```

Generated words
Event Name: `Words generated`
```
  {"prompt": prompt, "category": categories+words}
```

Generated sentences
Event Name: `Sentences generated`
```
  {"prompt": wordsString, "sentences": sentences}
```