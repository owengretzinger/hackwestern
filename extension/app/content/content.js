console.log('controller 000')

// const WS_URL = 'ws://localhost:8080'
// const WS_URL = 'ws://7b94-129-100-255-24.ngrok-free.app'
const WS_URL = 'wss://hackwestern11controller-88dfdd62efd5.herokuapp.com'

const main = async () => {

    const current_site = window.location.href

    if( !current_site.includes('suno') ) {
        console.log('not suno...')
        return
    }
    console.log('in suno...')

    // create indicator to represent connection status    
    const updateIndicator = (state) => {
        // if(state){
        //     chrome.runtime.sendMessage({ action: "changeIcon", iconPath: "/images/green-square.png" });
        // } else {
        //     chrome.runtime.sendMessage({ action: "changeIcon", iconPath: "/images/red-square.png" });
        // }
    }


    const wss = new WebSocket(WS_URL)
    console.log(wss)

    wss.onopen = async () => {
        console.log('Remote Connected')

        wss.send(JSON.stringify({
            action:'role',
            role: 'controller'
        }))

        updateIndicator(true)
    }

    wss.onmessage = async (message) => {
        const data = JSON.parse(message.data)
        console.log(data)

        const action = data.action

        switch(action) {
            
            case 'createSong':
                // const prompt = data.prompt
                const lyrics = data.lyrics
                const genre = data.genre
                // press button
                // make song public
                // return url
                console.log(genre)
                console.log(lyrics)

                if (!genre || !lyrics) return

                const lyrics_input = document.querySelector('textarea[placeholder="Enter your own lyrics"]')
                const genre_input = document.querySelector('textarea[placeholder="Enter style of music"]')

                console.log(lyrics_input)
                console.log(genre_input)

                function simulateTyping(textarea, text) {
                    let index = 0;
                  
                    function typeCharacter() {
                      if (index < text.length) {
                        const char = text[index];
                  
                        // Update the textarea's value as if the user is typing
                        textarea.value += char;
                  
                        // Trigger input event to update the DOM (such as form validations)
                        const inputEvent = new Event('input', { bubbles: true });
                        textarea.dispatchEvent(inputEvent);
                  
                        // Move to the next character after a short delay
                        index++;
                        typeCharacter()
                      }
                    }
                  
                    // Start typing the string
                    typeCharacter();
                }
                
                function deleteContent(textarea) {
                    if (textarea.value.length > 0) {
                        // Simulate backspace by removing the last character
                        textarea.value = textarea.value.slice(0, -1);
                
                        // Trigger input event after every deletion
                        const inputEvent = new Event('input', { bubbles: true });
                        textarea.dispatchEvent(inputEvent);
                
                        deleteContent(textarea); // Continue deleting until empty
                    }
                }
                
                // Example usage: simulate typing "Hello, world!" into the textarea
                simulateTyping(lyrics_input, lyrics);
                simulateTyping(genre_input, genre);

                console.log('continuing...')

                const buttons = document.querySelectorAll('button')
                let create_btn = null
                buttons.forEach(button => {
                    const spans = button.querySelectorAll('span')
                    spans.forEach(span => {
                        if (span.textContent.toLowerCase() == 'create'){
                            create_btn = button
                        }
                    })
                })

                // console.log('create elem:', create_btn)
                
                setTimeout(() => {
                    
                    const start_song_num = document.querySelectorAll('.react-aria-GridListItem').length
                    create_btn.click()
                    
                    let created_song = null
                    let loop = setInterval(()=>{
                        const list_items = document.querySelectorAll('.react-aria-GridListItem')
                        const song_num = list_items.length

                        if (start_song_num != song_num && list_items.length >= 0){
                            created_song = list_items.item(list_items.length - 1)

                            console.log(created_song)

                            deleteContent(lyrics_input)
                            deleteContent(genre_input)

                            // const public_toggle = created_song.querySelector('.flex.items-center.space-x-2')
                            const public_toggle = created_song.querySelector('.relative.inline-flex.items-center.h-4.w-7.rounded-full.transition-colors')
                            console.log(public_toggle)
                            public_toggle.click()

                            const id = created_song.getAttribute('data-key')
                            console.log(id)
                            const song_url = `https://cdn1.suno.ai/${id}.mp3`
                            console.log(song_url)
                            
                            setTimeout(() => {
                                wss.send(JSON.stringify({
                                    action: 'returnSong',
                                    returnID: data.returnID,
                                    songURL: song_url
                                }))
                                
                            }, 500) //timeout

                            clearInterval(loop)
                        }

                    }, 500) //interval
                }, 500) //timeout

                break;

        }
    }

    wss.onclose = () => {
        console.log('disconnected')
        updateIndicator(false)
    }

    wss.onerror = () => {
        console.warn('shit...')
    }
}

main()