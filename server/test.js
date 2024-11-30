// const ENDPOINT = 'http://localhost:8080'
const ENDPOINT = 'https://09be-129-100-255-24.ngrok-free.app/createSong'

const main = async () => {
    const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            prompt: "create a random song"
        })
    })

    console.log(await response.json())
}

main()