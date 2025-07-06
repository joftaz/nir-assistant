This file documents the logging (or logs the logs if you like)
After comparing Google Analytics and Mixpanel, we decided to use mixpanel for logging

useAutoTrackClicks.ts , analitics.ts


how to use?
    add to props at least the follwing attributs
        data-track-click="" // event name
    
    add attribute with the prefix 'data-analytics-':
          data-analytics-attribute-name="" // 

logged buttons:

Change person type
```
    data-track-click="Change person type clicked"
    data-analytics-button-name="Change person type"
    data-analytics-current-person-type={currentName}
```

Choose person type
```
    data-track-click="Choose person type clicked"
    data-analytics-button-name="Choose person type"
    data-analytics-choosen-person-type={icon.name} 
```

Menu 
```
    data-track-click="Open menu clicked"
    data-analytics-button-name="Menu"
```

MenuSideBar
```
    data-track-click={`${item.id} clicked`}
    data-analytics-button-name={item.title}

    data-track-click="Login clicked"
    data-analytics-button-name="Login"
```

Login
```
    data-track-click="Google Sign In clicked"
    data-analytics-button-name="Google Sign In"

    data-track-click="Login without account clicked"
    data-analytics-button-name="Login without account"
```

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
    data-analytics-word-category={category}
```

Play word
```
    data-track-click="Play word clicked"
    data-analytics-button-name="Play word speech"
    data-analytics-word-spoken={word}
    data-analytics-word-category={category}
```

Find synonyms
```
    data-track-click="Find synonyms clicked"
    data-analytics-button-name="Find synonyms"
    data-analytics-word-context={word}
    data-analytics-word-category={category}
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
    data-analytics-word-context={word}
    data-analytics-word-category={category}
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

Generate sentences type
```
    data-track-click="Generate sentences type clicked"
    data-analytics-button-name="Generate sentences type"
    data-analitycs-sentence-type={type.label}
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

History page
```
    data-track-click="Start new conversation clicked"
    data-analytics-button-name="Start new conversation"

    data-track-click="Load conversation history clicked" 
    data-analytics-button-name="Select conversation history"
    data-analytics-history={history.messages.length > 0 ? history.messages[0].text : "No messages"}

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