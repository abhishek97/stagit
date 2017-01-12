/**
 * Created by abhishek on 10/01/17.
 */
'use strict';

const getPixel = require('get-pixels');
const savePixel = require('save-pixels');
const fs = require('fs');

let start=0;


function encode(fileName , text  , options ,callback  ) {

    if(typeof  callback == 'undefined' )
    {
        callback = options;
        options = null;
    }
    let defaults = {
        delimiter : "|",
        bitRate : 8
    }

    options = defaults || options;

    getPixel(fileName , (err , pixels)=>{
        if(err)
        {
            callback(err);
            return ;
        }

        let nx = pixels.shape[0],
            ny = pixels.shape[1],
            nz = pixels.shape[2];

        let bin = "";
        //const textBuf = new Buffer(text , 'utf-8');
        text += options.delimiter;
        let add = "";
        let stub = 0;

        // get binary string for our message ,
        // also maintain bitRate as Size of each char

        for(let i=0;i<text.length ; i++)
        {
            add = text.charCodeAt(i).toString(2);

            // maintain bitRate
            while( add.length% (options.bitRate) )
            {
                add = "0" + add;
            }
            bin+=add;
        }


        let iter = 0;

        for(let i=0;i<nx;i++)
        {
            for(let j=0;j<ny;j++)
            {
                for(let k=0;k<nz-1;k++) {

                    //all text has been encoded
                    if(iter >= bin.length)
                    {
                        i = nx+1;
                        j = ny+1;
                        k = nz+1;
                        break;
                    }

                    // get color value of this pixel
                    let px = pixels.get(i,j,k);


                    //encode logic per bit
                    if(px % 2)
                    {
                        if(bin.charAt(iter) == "0")
                            px --;
                    }
                    else
                    {
                        if(bin.charAt(iter) == "1")
                            px ++;
                    }

                    pixels.set(i,j,k,px);

                    iter++;
                }
            }
        }

        //write the image to disk as png
        const dir = fileName.split('/');
        const imageName = dir.pop();
        const encodedFile =   imageName + "encoded" + ".png" ;
        const file = fs.createWriteStream( dir.join('/') +  "/" + encodedFile);
        let stream = savePixel(pixels , "png").pipe(file) ;

        //call callback when done!
        stream.on('finish' , function () {
            callback(null , encodedFile)
        });



    });
}

function decode(filePath , options , callback) {
    /*
     coded file (png)
     options : {
     deliminiter,
     bitrate

     */
    if(typeof  callback == 'undefined' )
    {
        callback = options;
        options = null;
    }

    let defaults = {
        delimiter : "|",
        bitRate : 8
    };

    options = options || defaults;

    let dec = "";
    let message = [];
    let x = 0;

    const dataFile = fs.readFile(filePath  , function (err , dataFile) {
        if(err)
        {
            callback(err);
            return ;
        }
        getPixel(dataFile, 'image/png', (err, pixels)=> {

            if(err)
            {
                callback(err);
                return ;
            }

            let nx = pixels.shape[ 0 ],
                ny = pixels.shape[ 1 ],
                nz = pixels.shape[ 2 ];


            for (let i = 0; i < nx; i++) {
                for (let j = 0; j < ny; j++) {
                    for (let k = 0; k < nz - 1; k++) {

                        if (parseInt(dec, 2) == options.delimiter.charCodeAt(0)) {
                            i = nx;
                            j = ny;
                            k = nz;
                            break;
                        }
                        if (x % (options.bitRate ) == 0 && x) {

                            message.push(parseInt(dec, 2));
                            dec = "";
                        }

                        if (parseInt(pixels.get(i, j, k)) % 2) {
                            dec = dec + "1";

                        }
                        else
                            dec = dec + "0";

                        x = x + 1;
                    }
                }
            }
            let finalCode = "";
            for (let ch of message) {
                finalCode += String.fromCharCode(ch);
            }
            callback(null, finalCode);
        });
    });

}

/*
 encode("cat.jpg" ,"FU" , function (err , encodedFile) {
 if (err) {
 console.error(err);
 return;
 }

 });


 decode("Encode_cat.jpg.png" , function (err , message) {
 if(err){
 console.error(err);
 return;
 }
 console.log(message);
 });

 */

module.exports = {
    encode ,
    decode
}

