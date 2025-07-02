logging:
using mixpanel

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