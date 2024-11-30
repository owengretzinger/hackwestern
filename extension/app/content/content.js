console.log('controller 000')

const WS_URL = 'ws://localhost:8080'

const main = async () => {
    const wss = new WebSocket(WS_URL)
    console.log(wss)

    wss.onopen = async () => {
        console.log('Remote Connected')

        wss.send(JSON.stringify({
            action:'role',
            role: 'controller'
        }))

    }

    wss.onmessage = async (message) => {
        const data = JSON.parse(message.data)
        console.log(data)

        const action = data.action

        switch(action) {
            
            case 'createSong':
                const prompt = data.prompt
                // press button
                // make song public
                // return url
                console.log(prompt)
                const input = document.querySelector('textarea')
                input.value = prompt

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
    }

    wss.onerror = () => {
        console.warn('shit...')
    }
}

main()