import React from "react"
import css from "../css/zp114_数据库管理.css"

const DB = ["product", "xdb", "user", "order"]
const ALL = "全部"
let exc, rd, id, db, types, type, data, count, list, Q, O, pop, editor, editorpop

function render() {
    return <React.Fragment>
        <div className="top">
            <strong>数据库管理</strong>
            <ul>{DB.map((a, i) => <li onClick={() => selectDB(a)} className={"ztab" + (a === db ? " zcur" : "")} key={i}>{a}</li>)}</ul>
            <input onBlur={search} onKeyDown={e => e.keyCode === 13 && search()} type="text" placeholder='{ "x.技能": { "$regex": "react" } }' className="zinput"/>
            <button onClick={search} className="zbtn">搜索</button>
            <button className="zbtn zfright"><input type="file" onChange={e => upload(e)} accept="application/json"/>导入</button>
        </div>
        <ul>{types.map((a, i) => <li onClick={() => selectType(a)} className={"ztab" + (a === type ? " zcur" : "")} key={i}>{a}</li>)}</ul>
        <table className={"ztable " + db}>
            <thead><tr><th>创建时间</th>{rTable[db].th.map(a => <th key={a}>{a}</th>)}</tr></thead>
            <tbody>{list.map((o, i) => 
                <tr onClick={() => selectData(o)} className={(i % 2 ? "" : "zodd") + (data && data._id === o._id ? " cur" : "")} key={i}>
                    <td>{exc(`date("${o._id}")`).format()}</td>{rTable[db].tr(o)}
                </tr>)}
                <tr className="observer"></tr>
            </tbody>
        </table>
        <div className="detail">
            {!data && !!count && <div><div style={{"marginBottom": "9px"}}>总数：{count || ""}</div>
                <div onClick={download} className="zbtn">导出</div>
                <div onClick={dels} className="zbtn">删除</div>
            </div>}
            <div className={data ? "" : "zhide"}><div className="jsoneditor"/></div>
            {!!data && <div>
                <div className="primaryKey">
                    <p><strong>_id:</strong>{data._id}</p>
                    {!!data.type && <p><strong>type:</strong>{data.type}</p>}
                    {!!data.key && <p><strong>key:</strong>{data.key}</p>}
                    {!!data.name && <p><strong>name:</strong>{data.name}</p>}
                    {!!data.phone && <p><strong>phone:</strong>{data.phone}</p>}
                    {!!data.mail && <p><strong>mail:</strong>{data.mail}</p>}
                </div>
                <button onClick={() => popup("y")} className={"zbtn" + (data.y && Object.keys(data.y).length ? " zprimary" : "")}>y</button>
                {data.wx && <button onClick={() => popup("wx")} className="zbtn zprimary">wx</button>}
                {data.products && <button onClick={() => popup("products")} className="zbtn zprimary">products</button>}
                {data.z && <button onClick={() => popup("z")} className="zbtn zprimary">z</button>}
                <div className="zfright">
                    {(db === "product" || db === "xdb") && <button onClick={tmpl} className="zbtn">模板</button>}
                    <button onClick={del} className="zbtn">删除</button>
                    <button onClick={save} className="zbtn" style={{marginRight: 0}}>保存</button>
                </div>
                {!!pop && <div className="zmodals">
                    <div className="zmask" onClick={() => {pop = undefined; rd()}}/>
                    <div className="zmodal">
                        <div className="zmodal_bd editorpop"/>
                        {pop === "y" && <button onClick={saveY} className="zbtn popbtn">保存</button>}
                        {pop === "tmpl" && <button onClick={insert} className="zbtn popbtn">插入新数据</button>}
                    </div>
                </div>}
            </div>}
        </div>
    </React.Fragment>
}

function init(ref) {
    exc = ref.exc
    rd = ref.render
    id = ref.id
    db = "product"
    type = "全部"
    types = ["全部"]
    list = []
    exc('load("https://z.zccdn.cn/vendor/monaco_0.31.1/monaco-loader.min-1.2.0.js")', null, () => {
        monaco_loader.config({ paths: { vs: "https://z.zccdn.cn/vendor/monaco_0.31.1/vs" } })
        monaco_loader.init().then(monaco => {
            let el = $("#" + id + " .observer")
            el ? init_(ref, el) : setTimeout(() => {
                el = $("#" + id + " .observer")
                init_(ref, el)
            }, 2000)
        })
    })
}

function init_(ref, el) {
    initData()
    editor = monaco.editor.create($("#" + id + " .jsoneditor"), {
        language: "json",
        value: "{}",
        tabSize: 2,
        lineNumbers: "off",
        fixedOverflowWidgets: true,
        minimap: { enabled: false },
        scrollbar: { alwaysConsumeMouseWheel: false },
        formatOnPaste: true,
        automaticLayout: true,
        scrollBeyondLastLine: false,
    })
    const o = new IntersectionObserver(entries => entries.forEach(editor => {
        if (!editor.intersectionRatio) return
        if (list && count > list.length) {
            O.skip = list.length
            exc(`$${db}.search("zp114.type", Q, O, null, 1)`, { type, Q, O }, R => {
                list = list.concat(R.arr)
                count = R.count
                getUsers(R)
                rd()
            })
        }
    }), {})
    o.observe(el)
}

function initData() {
    exc(`$${db}.distinct("zp114.types_${db}", "type")`, {}, R => {
        types = [ALL].concat(R.arr)
        let select = "-site -x -y -__v"
        if (db === "user") select += " -wx -hashpw -salt"
        if (db === "order") select += " -z -products"
        O = { limit: 30, skip: 0, sort: { _id: -1 }, select }
        exc(`$${db}.search("zp114.全部", {}, O, null, 1)`, { O }, R => {
            list = R.arr
            count = R.count
            getUsers(R)
            rd()
        })
    })
}

const rTable = {
    product: {
        th: ["创建者", "名称"],
        tr: o => <React.Fragment>
                <td>{userName(o.auth)}</td>
                <td>{o.name}</td>
            </React.Fragment>
    },
    xdb: {
        th: ["KEY"],
        tr: o => <React.Fragment>
                <td>{o.key}</td>
            </React.Fragment>
    },
    user: {
        th: ["手机号", "权限", "状态"],
        tr: o => <React.Fragment>
                <td>{o.phone}</td>
                <td>{o.role ? o.role.toString() : ""}</td>
                <td>{o.status}</td>
            </React.Fragment>
    },
    order: {
        th: ["付款人", "金额", "描述"],
        tr: o => <React.Fragment>
                <td>{userName(o.auth)}</td>
                <td>{o.total}</td>
                <td>{o.desc}</td>
            </React.Fragment>
    },
}

function selectDB(_db) {
    db = _db
    list = []
    data = undefined
    count = undefined
    type = "全部"
    initData()
}

function selectType(_type) {
    type = _type
    data = undefined
    list = []
    O.skip = 0
    Q = type === ALL ? {} : { type }
    exc(`$${db}.search("zp114.type", Q, O, null, 1)`, { type, Q, O }, R => {
        list = R.arr
        count = R.count
        getUsers(R)
        rd()
    })
}

function selectData(o) {
    getX(o, o => {
        data = o
        editor.setValue(o.x && Object.keys(o.x).length ? JSON.stringify(o.x, null, "\t") : "{\n\n\n}")
        rd()
    })
}

function getX(o, cb) {
    if (o.x) return cb(o)
    exc(`$${db}.get("${o._id}")`, null, R => {
        if (!R.x) R.x = {}
        cb(R)
    })
}

function popup(k) {
    pop = k
    rd()
    setTimeout(() => {
        editorpop = monaco.editor.create($("#" + id + " .editorpop"), {
            language: "json",
            value: data[k] && Object.keys(data[k]).length ? JSON.stringify(data[k], null, "\t") : "{\n\n\n}",
            tabSize: 2,
            readOnly: k !== "y",
            lineNumbers: "off",
            fixedOverflowWidgets: true,
            minimap: { enabled: false },
            scrollbar: { alwaysConsumeMouseWheel: false },
            formatOnPaste: true,
            automaticLayout: true,
            scrollBeyondLastLine: false,
        })
    }, 9)
}

function tmpl() {
    pop = "tmpl"
    rd()
    setTimeout(() => {
        let d = JSON.parse(JSON.stringify(data))
        delete d._id
        delete d.auth
        delete d.sel
        editorpop = monaco.editor.create($("#" + id + " .editorpop"), {
            language: "json",
            value: JSON.stringify(d, null, "\t"),
            tabSize: 2,
            lineNumbers: "off",
            fixedOverflowWidgets: true,
            minimap: { enabled: false },
            scrollbar: { alwaysConsumeMouseWheel: false },
            formatOnPaste: true,
            automaticLayout: true,
            scrollBeyondLastLine: false,
        })
    }, 9)
}

function getUsers(R) {
    if (!R || !R.arr || (db !== "product" && db !== "order")) return
    let arr = []
    R.arr.map(a => a.auth).forEach(a => {
        if (a && !arr.includes(a) && !exc('$c.user[auth]', { auth: a })) arr.push(a)
    })
    if (arr.length) exc(`$user.search("zp114.user", Q, O)`, { Q: { _id: { $in: arr } }, O: { limit: 0, select: "x.姓名 x.name wx.nickname" } }, () => rd())
}

function userName(auth) {
    const o = exc('$c.user[auth]', { auth })
    let x = ""
    if (!o) return x
    if (o.x) x = o.x.姓名 || o.x.name
    if (!x && o.wx) x = o.wx.nickname
    return x
}

function search() {
    Q = $("#" + id + " .top input").value
    if (!Q) return
    if (!Q.startsWith("{") || !Q.endsWith("}")) return exc('warn("搜索条件必须是合法的json")')
    Q = exc(Q)
    if (typeof Q !== "object") return exc(`alert("搜索条件必须是合法的json")`)
    if (type !== ALL) Q.type = type
    O.skip = 0
    exc(`$${db}.search("zp114.typeS", Q, O, null, 1)`, { type, Q, O }, R => {
        list = R.arr
        count = R.count
        getUsers(R)
        rd()
    })
}

function save() {
    let x
    try {
        x = JSON.parse(editor.getValue())
    } catch (e) {
        return exc(`alert("数据不合法", "${e.message}")`)
    }
    exc(`confirm("注意", "确定要保存更改吗?"); $${db}.modify(_id, {x}); $r._id ? info("已保存") : warn("保存失败")`, { _id: data._id, x })
}

function saveY() {
    let y
    try {
        y = JSON.parse(editorpop.getValue())
    } catch (e) {
        return exc(`alert("数据不合法", "${e.message}")`)
    }
    exc(`confirm("注意", "确定要保存更改吗?"); $${db}.modify(_id, {y}); $r._id ? info("已保存") : warn("保存失败"); $r(1)`, { _id: data._id, y }, o => data = o)
}

function insert() {
    try {
        const o = JSON.parse(editorpop.getValue())
        exc(`confirm("注意", "确定要插入新数据吗?"); $${db}.create(o.type, db == "xdb" ? o.key : o.x, o.x); $r._id && o.y ? $${db}.modify($r._id, {y: o.y}) : ""; $r(1)._id ? info("已插入") : warn("插入失败")`, { db, o }, () => {
            pop = undefined;
            selectType(type)
        })
    } catch (e) {
        return exc(`alert("数据不合法", "${e.message}")`)
    }
}

function download() {
    if (count < 1000) return download_()
    exc(`confirm("提示", "数据量有点大, 确定要导出${count}条数据吗")`, {}, () => download_())
}

function download_() {
    const limit = 200
    let skip = 0
    let repeat = Array(Math.ceil(count / limit))
    let arr = []
    calls(repeat, (step, next, i) => {
        exc(`$${db}.search("zp114.download", Q, O)`, { type, Q: type && type !== "全部" ? { type } : {}, O: { limit, skip, select: "-site -__v" } }, R => {
            if (R.arr) R.arr.forEach(a => {
                delete a.sel
                arr.push(a)
            })
            exc(`info("已加载${arr.length}条数据")`)
            skip = skip + limit
            next()
        })
    }, () => {
        let a = document.createElement("a")
        a.download = db + "_" + type + ".json"
        a.style.display = "none"
        const blob = new Blob([JSON.stringify({
            [db]: arr
        })])
        a.href = URL.createObjectURL(blob)
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
    })
}

function upload(e) {
    let f = e.target.files[0]
    if (!f) return
    let reader = new FileReader()
    reader.onload = function(e) {
        const o = JSON.parse(e.target.result)
        if (!o || !Array.isArray(o[db])) return exc('warn("上传的数据不符合格式要求")')
        exc('$api.import(o)', { o })
    }
    reader.readAsText(f)
}

function del() {
    exc(`confirm("危险!", "确定要删除吗? 删除不可恢复!"); db == "user" ? $api.service("deleteUser", {_id}) : $${db}.delete(_id); $r._id ? info("已删除") : warn("删除失败"); render()`, { _id: data._id, db }, () => selectType(type))
}

function dels() {
    const cmd = `
    confirm("危险!", "将会批量删除此类型下的所有数据? 共有${count}个!")
    confirm("再次确认!", "确定要彻底删除吗? 删除后不可恢复!")
    $${db}.search("zp114.dels" + type, Q, O)
    $r.arr ? $r.arr.map('$x._id').forEach('$${db}.delete($x)') : warn("出错了")
    info("删除完成")
    `
    exc(cmd, { db, type, Q, O: { limit: 0, select: "_id" } }, () => selectDB(db))
}

function calls(arr, fn, next) {
    let cb = {
        [arr.length]: () => next()
    }
    for (let i = arr.length - 1; i > 0; i--) {
        cb[i] = () => fn(arr[i], cb[i + 1])
    }
    fn(arr[0], cb[1])
}

$plugin({
    id: "zp114",
    render,
    init,
    css
})