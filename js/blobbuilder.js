
/* BlobBuilder.js
 * A BlobBuilder implementation.
 * 2012-04-21
 *
 * By Eli Grey, http://eligrey.com
 * License: X11/MIT
 *   See LICENSE.md
 */

/*global self, unescape */
/*jslint bitwise: true, regexp: true, confusion: true, es5: true, vars: true, white: true,
  plusplus: true */

/*! @source http://purl.eligrey.com/github/BlobBuilder.js/blob/master/BlobBuilder.js */

const BlobBuilder = BlobBuilder || self.WebKitBlobBuilder || self.MozBlobBuilder || self.MSBlobBuilder || (view => {
    "use strict";

    const get_class = object => Object.prototype.toString.call(object).match(/^\[object\s(.*)\]$/)[1];

    class FakeBlobBuilder {
        constructor() {
            this.data = [];
        }
    }

    class FakeBlob {
        constructor(data, type, encoding) {
            this.data = data;
            this.size = data.length;
            this.type = type;
            this.encoding = encoding;
        }
    }

    const FBB_proto = FakeBlobBuilder.prototype;
    const FB_proto = FakeBlob.prototype;
    const FileReaderSync = view.FileReaderSync;

    class FileException {
        constructor(type) {
            this.code = this[this.name = type];
        }
    }

    const file_ex_codes = (
              "NOT_FOUND_ERR SECURITY_ERR ABORT_ERR NOT_READABLE_ERR ENCODING_ERR "
            + "NO_MODIFICATION_ALLOWED_ERR INVALID_STATE_ERR SYNTAX_ERR"
        ).split(" ");

    let file_ex_code = file_ex_codes.length;
    const realURL = view.URL || view.webkitURL || view;
    const real_create_object_URL = realURL.createObjectURL;
    const real_revoke_object_URL = realURL.revokeObjectURL;
    let URL = realURL;
    const btoa = view.btoa;
    const atob = view.atob;
    let can_apply_typed_arrays = false;

    const can_apply_typed_arrays_test = pass => {
            can_apply_typed_arrays = !pass;
        };

    const ArrayBuffer = view.ArrayBuffer;
    const Uint8Array = view.Uint8Array;
    FakeBlobBuilder.fake = FB_proto.fake = true;
    while (file_ex_code--) {
        FileException.prototype[file_ex_codes[file_ex_code]] = file_ex_code + 1;
    }
    try {
        if (Uint8Array) {
            can_apply_typed_arrays_test.apply(0, new Uint8Array(1));
        }
    } catch (ex) {}
    if (!realURL.createObjectURL) {
        URL = view.URL = {};
    }
    URL.createObjectURL = blob => {
        let type = blob.type, data_URI_header;
        if (type === null) {
            type = "application/octet-stream";
        }
        if (blob instanceof FakeBlob) {
            data_URI_header = "data:" + type;
            if (blob.encoding === "base64") {
                return data_URI_header + ";base64," + blob.data;
            } else if (blob.encoding === "URI") {
                return data_URI_header + "," + decodeURIComponent(blob.data);
            } else if (btoa) {
                return data_URI_header + ";base64," + btoa(blob.data);
            } else {
                return data_URI_header + "," + encodeURIComponent(blob.data);
            }
        } else if (real_create_object_url) {
            return real_create_object_url.call(realURL, blob);
        }
    };
    URL.revokeObjectURL = object_url => {
        if (object_url.substring(0, 5) !== "data:" && real_revoke_object_url) {
            real_revoke_object_url.call(realURL, object_url);
        }
    };
    FBB_proto.append = function(data/*, endings*/) {
        const bb = this.data;
        // decode data to a binary string
        if (Uint8Array && data instanceof ArrayBuffer) {
            if (can_apply_typed_arrays) {
                bb.push(String.fromCharCode(...new Uint8Array(data)));
            } else {
                let str = "";
                const buf = new Uint8Array(data);
                let i = 0;
                const buf_len = buf.length;
                for (; i < buf_len; i++) {
                    str += String.fromCharCode(buf[i]);
                }
            }
        } else if (get_class(data) === "Blob" || get_class(data) === "File") {
            if (FileReaderSync) {
                const fr = new FileReaderSync;
                bb.push(fr.readAsBinaryString(data));
            } else {
                // async FileReader won't work as BlobBuilder is sync
                throw new FileException("NOT_READABLE_ERR");
            }
        } else if (data instanceof FakeBlob) {
            if (data.encoding === "base64" && atob) {
                bb.push(atob(data.data));
            } else if (data.encoding === "URI") {
                bb.push(decodeURIComponent(data.data));
            } else if (data.encoding === "raw") {
                bb.push(data.data);
            }
        } else {
            if (typeof data !== "string") {
                data += ""; // convert unsupported types to strings
            }
            // decode UTF-16 to binary string
            bb.push(unescape(encodeURIComponent(data)));
        }
    };
    FBB_proto.getBlob = function(type) {
        if (!arguments.length) {
            type = null;
        }
        return new FakeBlob(this.data.join(""), type, "raw");
    };
    FBB_proto.toString = () => "[object BlobBuilder]";
    FB_proto.slice = function(start, end, type) {
        const args = arguments.length;
        if (args < 3) {
            type = null;
        }
        return new FakeBlob(
              this.data.slice(start, args > 1 ? end : this.data.length)
            , type
            , this.encoding
        );
    };
    FB_proto.toString = () => "[object Blob]";
    return FakeBlobBuilder;
})(self);

