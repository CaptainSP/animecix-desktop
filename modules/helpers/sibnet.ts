import axios from "axios"

export class Sibnet {
    
    static found(url: string, after:any) : Sibnet {
        axios.get(url).then(response => {
            let data = response.data
            let l1 = data.split('player.src([{src: "')[1]
            let l2 = l1.split('"')[0]
            after("https://video.sibnet.ru" + l2)
        })
        return this
    }


}