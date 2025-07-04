This file documents the logging (or logs the logs if you like)
After comparing Google Analytics and Mixpanel, we decided to use mixpanel for logging

useAutoTrackClicks.ts , analitics.ts


how to use?
    add to props at least the follwing attributs
        data-track-click="" // event name
    
    add attribute with the prefix 'data-analytics-':
          data-analytics-attribute-name="" // 


logged buttons:
Send word
```   
    data-track-click="Send word clicked"
    data-analytics-button-name="Send word"
    data-analitycs-word={topic.trim() || '""'}
```
 
Refresh words
```
    data-track-click="Refresh words clicked"
    data-analytics-button-name="Refresh Suggested Words"
```

Create Sentences
```
    data-track-click="Create Sentences clicked"
    data-analytics-button-name="Create Sentences"
```

Suggestion words card
```
    data-track-click="Select suggested word clicked"
    data-analitycs-button-name="Word suggestion"
    data-analytics-word-category={category}
    data-analytics-selected-word={word}
```

Add word
```
    data-track-click="Add word clicked"
    data-analytics-button-name="Add word"
    data-analytics-added-word={word}
```

Play word
```
    data-track-click="Play word clicked"
    data-analytics-button-name="Play word speech"
    data-analytics-word-spoken={word}
```

Find synonyms
```
    data-track-click="Find synonyms clicked"
    data-analytics-button-name="Find synonyms"
    data-analytics-context={word}
```

Back
```
    data-track-click="Back (synonyms) clicked"
    data-analytics-button-name="Back"
    data-analytics-context="Back from synonyms suggestions"
```

Add word (synonym)
```
    data-track-click="Add word (synonym) clicked"
    data-analytics-button-name="Select synonym"
    data-analytics-added-synonym={synonym}
    data-analytics-word-context={word}
```
 
Remove word
```
    data-track-click="Remove word clicked"
    data-analytics-button-name="Remove word"
    data-analytics-removed-word={item.text}
```

Generate sentences
```
            data-track-click="Generate sentences clicked"
            data-analytics-button-name="Generate sentences"
```


Conversation mode
```
            data-track-click="Conversation mode clicked"
            data-analytics-button-name="Toggle conversation mode"
            data-analytics-conversation-mode={isConversationMode ? "true" : "false"}
            data-analytics-children-mode={isChildrenMode ? "true" : "false"}
```

Children mode
```
            data-track-click="Children mode clicked"
            data-analytics-button-name="Toggle children mode"
            data-analytics-conversation-mode={isConversationMode ? "true" : "false"}
            data-analytics-children-mode={isChildrenMode ? "true" : "false"}
```

Suggestion words card
```
    data-track-click="Add sentence clicked"
    data-analytics-button-name="Select sentence"
    data-analytics-added-sentence={sentence}
    if old sentences
    data-analytics-location="old-sentences"
```

Copy sentence
```
    data-track-click="Copy sentence clicked"
    data-analytics-button-name="Copy sentence"
    data-analytics-copied-sentence={sentence}
    if old sentences
    data-analytics-location="old-sentences"
```

Play sentence
```
    data-track-click="Play sentence clicked"
    data-analytics-button-name="Play sentence speech"
    data-analytics-playing-sentence={sentence}
    if old sentences
    data-analytics-location="old-sentences"
```

Generate more sentences
```
    data-track-click="Generate sentences clicked"
    data-analytics-button-name="Generate more sentences"
```

Close sentences
```
    data-track-click="Close sentences clicked"
    data-analytics-button-name="Close sentences"
```

Settings
```
    data-track-click="Settings clicked"
```

Delete conversation
```
    data-track-click="Delete conversation clicked"
    data-analytics-button-name=Delete conversation
```

Conversation history
```
    data-track-click="Conversation history clicked"
    data-analytics-button-name=Conversation history
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