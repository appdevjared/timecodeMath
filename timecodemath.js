//JavaScript SMPTE Library
//Author: me@jared.design
//Version: 1.0

function timecodeMath(operation, framerate, ...timecodes) {
    operation = operation.toLowerCase()
    let validOperations = ["sum", "difference", "multiply", "divide"];
    if (validOperations.indexOf(operation) === -1) {
      throw new Error("Invalid Operation");
    }
    let timecodeArray = [];
    if (Array.isArray(arguments[2])) {
      for (let i = 0; i < arguments[2].length; i ++) {
        timecodeArray.push(arguments[2][i][0])
      }
    } else {
      for (let i = 2; i < arguments.length; i ++) {
        timecodeArray.push(arguments[i]);
      }
    }
    let frameCount = 0;
    let tc1 = new Timecode(timecodeArray[0], framerate);
    let tc2 = new Timecode(timecodeArray[1], framerate);
    switch(operation) {
      case "sum":
          for (let i = 0; i < timecodeArray.length; i ++) {
            let timecode = new Timecode(timecodeArray[i], framerate);
            frameCount += timecode.totalFrames;
          }
        break;
      case "difference":
          if (timecodeArray.length > 2) {
            throw new Error("Can only accept two timecodes arguments when subtracting");
          }
          if (tc1.totalFrames > tc2.totalFrames) {
            frameCount = tc1.totalFrames - tc2.totalFrames; 
          } else {
            frameCount = tc2.totalFrames - tc1.totalFrames;
          }
        break;
      case "multiply":
          frameCount += tc1.totalFrames;
          for (let i = 1; i < timecodeArray.length; i ++) {
            let timecode = new Timecode(timecodeArray[i], framerate);
            frameCount *= timecode.totalFrames;
          }
        break;
      case "divide":
          if (timecodeArray.length > 2) {
            throw new Error("Can only accept two timecodes arguments when dividing");
          }
          if (tc1.totalFrames > tc2.totalFrames) {
            frameCount = tc1.totalFrames / tc2.totalFrames; 
          } else {
            frameCount = tc2.totalFrames / tc1.totalFrames;
          }
        break;
    }
    return new Timecode(frameCount, framerate).smpte;
  }
  
class Timecode {
    constructor(time, framerate) {       
        this.framerate = framerate;
        this.totalFrames = time; 
        this.author = "me@jared.design";
        this.version = "1.0";
    }

    get pseudoFrames() {
        return this._totalFrames + this.droppedFrames;
    }

    set pseudoFrames(arg) {
        throw new Error("I'm sorry Dave...");
    }

    get supportedFramerates() {
        return ["23.976", "24", "25", "29.97", "29.97df", "30", "50", "59.94", "59.94df", "60"];
    }

    set supportedFramerates(arg) {
        throw new Error("I'm sorry Dave...");
    }
    
    get framerate() {
        return this._framerate;
    }

    set framerate(framerate) {
        if (this.supportedFramerates.indexOf(framerate) !== -1) {
            this._framerate = framerate;
        } else {
            throw new Error("Unsupported framerate");
        }
    }

    get totalFrames() {
        return this._totalFrames;
    }

    set totalFrames(time) {
        if (Number.isInteger(time)) {
            if (time <= 0) {
                this._totalFrames = 0;
            } else if (time >= ((this.fps * 60 * 60 * 99) + (this.fps * 60 * 59) + (this.fps * 59) + (this.fps - 1))) {
                this._totalFrames = (this.fps * 60 * 60 * 99) + (this.fps * 60 * 59) + (this.fps * 59) + (this.fps -1);
            } else {
                this._totalFrames = time;
            }
        } else if (/\d\d[:]\d\d[:]\d\d[:;.]\d\d/.test(time)) {
            let hh = parseInt(time.substring(0, 2));
            let mm = parseInt(time.substring(3, 5));
            let ss = parseInt(time.substring(6, 8));
            let ff = parseInt(time.substring(9, 11));
            ff += ss * this.fps;
            ff += mm * this.fpm;
            ff += hh * this.fph;
            if (this.dropFrame) {
                let totalMinutes = mm + (hh * 60);
                let tenthMinutes = Math.floor(totalMinutes / 10);
                ff -= totalMinutes * this.dropFrameQuantity;
                ff += tenthMinutes * this.dropFrameQuantity;
            }
            if (ff <= 0) {
                this._totalFrames = 0;
            } else if (ff >= ((this.fps * 60 * 60 * 99) + (this.fps * 60 * 59) + (this.fps * 59) + (this.fps - 1))) {
                this._totalFrames = (this.fps * 60 * 60 * 99) + (this.fps * 60 * 59) + (this.fps * 59) + (this.fps -1);
            } else {
                this._totalFrames = ff;
            }
        }
        else {
            throw new Error("Argumment must be an integer or SMPTE formatted timecode");
        }
    }

    get dropFrame() {
        let framerate = this._framerate;
        let suffix = this._framerate.substring(this._framerate.length - 2, this._framerate.length)
        if (suffix === "df") {
            return true;
        } else {
            return false;
        }
    }

    set dropFrame(arg) {
        throw new Error("I'm sorry Dave...");
    }

    get speed() {
        let framerate = this._framerate;
        framerate = framerate.replace("d", "");
        framerate = framerate.replace("f", "")
        return parseFloat(framerate);
    }    

    set speed(arg) {
        throw new Error("I'm sorry Dave...");
    }

    get fps() {
        return Math.round(this.speed)
    }

    set fps(arg) {
        throw new Error("I'm sorry Dave...");
    }

    get fpm() {
        return this.fps * 60;
    }

    set fpm(arg) {
        throw new Error("I'm sorry Dave...");
    }

    get fph() {
        return this.fpm * 60;
    }

    set fph(arg) {
        throw new Error("I'm sorry Dave...");
    }

    get smpte() {
        let indicator = ":";
        if (this.dropFrame) {
            indicator = ";"
        }
        let hh = this.hours;
        let mm = this.minutes;
        let ss = this.seconds;
        let ff = this.frames;
        return `${this.leadingZero(hh)}:${this.leadingZero(mm)}:${this.leadingZero(ss)}${indicator}${this.leadingZero(ff)}`;
    }

    set smpte(timecode) {
        this.totalFrames = timecode;
    }

    leadingZero(number) {
        let lead = "";
        if (number < 10) {
            lead = 0;
        }
        return lead + String(number);
    }

    get hours() {
        return Math.floor(this.pseudoFrames / this.fph);
    }

    set hours(hours) {
        if (hours < 99) {
            hours = this.leadingZero(hours);
            this.smpte = hours + this.smpte.substring(2, 11);

        } else {
            throw new Error("Argument must be an integer less than 99");
        }
    }

    get minutes() {
        return Math.floor(this.pseudoFrames / this.fpm) - (this.hours * 60);
    }

    set minutes(minutes) {
        if (minutes < 60) {
            minutes = this.leadingZero(minutes);
            this.smpte = this.smpte.substring(0, 3) + minutes + this.smpte.substring(5, 11);

        } else {
            throw new Error("Argument must be an integer less than 60");
        }
    }

    get seconds() {
        return Math.floor(this.pseudoFrames / this.fps) - (this.hours * 60 * 60) - (this.minutes * 60);
    }

    set seconds(seconds) {
        if (seconds < 60) {
            seconds = this.leadingZero(seconds);
            this.smpte = this.smpte.substring(0, 6) + seconds + this.smpte.substring(5, 11);

        } else {
            throw new Error("Argument must be an integer less than 60");
        }
    }

    get frames() {
        return Math.floor(this.pseudoFrames) - (this.hours * 60 * 60 * this.fps) - (this.minutes * 60 * this.fps) - (this.seconds * this.fps);
    }

    set frames(frames) {
        if (frames < this.fps) {
            frames = this.leadingZero(frames);
            this.smpte = this.smpte.substring(0, 9) + frames;
        } else {
            throw new Error("Argument must be an integer less than the framerate");
        }
    }

    get dropFrameQuantity() {
        switch(this.fps) {
            case 30: 
                return 2;
            case 60:
                return 4;
        }
    }

    set dropFrameQuantity(arg) {
        throw new Error("I'm sorry Dave...");
    }

    get droppedFrames() {
        let droppedFrames = 0;
        if (this.dropFrame) {
            let counter = this.totalFrames;
            for (let frames = 0; frames <= counter; frames += this.fpm) {
                if ((frames / this.fpm) % 10 !== 0) {
                    droppedFrames += this.dropFrameQuantity;
                    counter += this.dropFrameQuantity;
                }
            }
        }
        return droppedFrames;
    }

    set droppedFrames(arg) {
        throw new Error("I'm sorry Dave...");
    }
}
